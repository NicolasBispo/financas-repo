# frozen_string_literal: true

# Importa o CSV de despesas (planilha 2025-2029) para o ledger de
# financial_transactions, respeitando a estrutura do domínio:
#
#   PARCELADA  -> 1 installment_root (a "compra") + N installment_part (parcelas)
#   RECORRENTE -> 1 recurring_root (template) + N recurring_occurrence (lançamentos)
#   AVULSA     -> 1 standalone
#
# Campos extras do CSV (Conta Pagamento, Meio Pagamento, Data pagamento,
# Anotações) são gravados nas colunas adicionadas pela migration
# AddPaymentDetailsToFinancialTransactions.
#
# Uso:
#   bundle exec rails runner db/imports/import_financas_csv.rb
#   CSV_PATH=/caminho.csv USER_ID=1 CATEGORY=Geral FORCE=1 bundle exec rails runner db/imports/import_financas_csv.rb

require 'csv'
require 'bigdecimal'

CSV_PATH      = ENV.fetch('CSV_PATH', Rails.root.join('db/imports/financas_2025_2029.csv').to_s)
CURRENCY      = ENV.fetch('CURRENCY', 'BRL')
CATEGORY_NAME = ENV.fetch('CATEGORY', 'Geral')
SENTINEL_DESC = 'EMPRESTIMO POSTALIS (49/96)' # marca de "já importado"

user =
  if ENV['USER_ID'].present?
    User.find(ENV['USER_ID'])
  else
    User.order(:id).first
  end
abort 'Nenhum usuário encontrado. Defina USER_ID=...' unless user

# ── helpers de parsing ──────────────────────────────────────────────────────

# "R$ 1.079,45" -> 1079.45 ; "331,16" -> 331.16 ; "" / "w" -> nil
def parse_amount(raw)
  s = raw.to_s.strip
  return nil if s.empty?

  s = s.gsub(/r\$\s*/i, '').strip.delete('.').tr(',', '.')
  return nil unless s.match?(/\A-?\d+(\.\d+)?\z/)

  BigDecimal(s)
end

# "13/11/2025" -> Time (midnight, app tz) ; "" -> nil
def parse_date(raw)
  s = raw.to_s.strip
  return nil if s.empty?

  # base 10 explícita: "08"/"09" seriam lidos como octal inválido sem ela.
  d, m, y = s.split('/').map { |p| Integer(p, 10, exception: false) }
  return nil unless d && m && y

  Time.zone.local(y, m, d)
rescue ArgumentError
  nil
end

def parse_paid(raw)
  raw.to_s.include?('✅')
end

def parse_int(raw)
  Integer(raw.to_s.strip, 10, exception: false)
end

def squish_up(str)
  str.to_s.upcase.gsub(/\s+/, ' ').strip
end

# Agrupa variações de nome da mesma compra parcelada num único plano.
INSTALLMENT_DISPLAY = {
  'EMPRESTIMO POSTALIS'      => 'EMPRESTIMO POSTALIS',
  'CAMA HOSPITALAR (COMPRA)' => 'CAMA HOSPITALAR (COMPRA)'
}.freeze

def installment_key(name)
  u = squish_up(name)
  return 'EMPRESTIMO POSTALIS' if u.include?('POSTALIS')
  return 'CAMA HOSPITALAR (COMPRA)' if u.include?('CAMA HOSPITALAR')

  u
end

# Agrupa variações de nome da mesma despesa recorrente num único template.
RECURRING_DISPLAY = {
  'CPFL JP'                     => 'CPFL JP',
  'CARTAO CREDITO SUELI NUBANK' => 'CARTAO CREDITO SUELI NUBANK'
}.freeze

def recurring_key(name)
  u = squish_up(name)
  return 'CPFL JP' if u.include?('CPFL')
  return 'CARTAO CREDITO SUELI NUBANK' if u.include?('CARTAO CREDITO SUELI')

  u
end

# Fonoaudióloga: ocorre ~4x ao longo das semanas do mês -> semanal.
def recurring_frequency(key)
  key == 'FONOAUDIOLOGA' ? :weekly : :monthly
end

# ── leitura e classificação ─────────────────────────────────────────────────

installment_groups = {} # key => { display:, total:, parts: [] }
recurring_groups   = {} # key => { display:, freq:, occ:  [] }
standalones        = []
account_names      = []
skipped            = []

CSV.read(CSV_PATH, headers: true).each_with_index do |row, idx|
  line = idx + 2 # +1 header, +1 base-1
  tipo = squish_up(row['TIPO'])
  desc = row['Nome Despesa'].to_s.strip
  due  = parse_date(row['Vencimento'])

  unless %w[PARCELADA RECORRENTE AVULSA].include?(tipo)
    skipped << [line, desc, "TIPO inválido/vazio (#{row['TIPO'].inspect})"]
    next
  end
  if due.nil?
    skipped << [line, desc, "Vencimento inválido (#{row['Vencimento'].inspect})"]
    next
  end

  common = {
    amount:       parse_amount(row['Valor']),
    paid:         parse_paid(row['Pago']),
    account:      row['Conta Pagamento'].to_s.strip.presence,
    method:       row['Meio Pagamento'].to_s.strip.presence,
    payment_date: parse_date(row['Data pagamento']),
    notes:        row['Anotacoes'].to_s.strip.presence
  }
  account_names << common[:account] if common[:account]

  case tipo
  when 'PARCELADA'
    number = parse_int(row['Parcela'])
    if number.nil?
      skipped << [line, desc, 'PARCELADA sem número de parcela']
      next
    end
    key   = installment_key(desc)
    group = installment_groups[key] ||= { display: INSTALLMENT_DISPLAY[key] || desc, total: nil, parts: [] }
    total = parse_int(row['Total Parcelas'])
    group[:total] = [group[:total], total].compact.max
    group[:parts] << common.merge(number: number, due: due)

  when 'RECORRENTE'
    key   = recurring_key(desc)
    group = recurring_groups[key] ||= { display: RECURRING_DISPLAY[key] || desc, freq: recurring_frequency(key), occ: [] }
    group[:occ] << common.merge(due: due)

  when 'AVULSA'
    standalones << common.merge(description: desc, due: due)
  end
end

# ── guarda contra reimportação acidental ────────────────────────────────────

if user.financial_transactions.exists?(description: SENTINEL_DESC) && ENV['FORCE'].blank?
  abort "Importação já parece ter sido executada (encontrei '#{SENTINEL_DESC}'). " \
        'Rode com FORCE=1 para importar de novo.'
end

# ── inserção ────────────────────────────────────────────────────────────────

counts = Hash.new(0)

ActiveRecord::Base.transaction do
  category = user.transaction_categories
                 .where('lower(name) = ?', CATEGORY_NAME.downcase)
                 .first_or_create!(name: CATEGORY_NAME)

  accounts = account_names.uniq.index_with do |name|
    user.bank_accounts.where(name: name).first_or_create!(name: name, default_currency: CURRENCY)
  end
  counts[:bank_accounts] = accounts.size

  # PARCELADA -> root + parcelas
  installment_groups.each_value do |group|
    parts   = group[:parts].sort_by { |p| [p[:number], p[:due]] }
    total   = group[:total] || parts.map { |p| p[:number] }.max
    sum     = parts.sum { |p| p[:amount] || 0 }
    started = parts.map { |p| p[:due] }.compact.min

    root = FinancialTransaction.build_installment_root(
      user: user, description: group[:display], total_amount: sum,
      total_installments: total, category: category, start_date: started,
      currency_code: CURRENCY
    )
    root.save!
    counts[:installment_roots] += 1

    parts.each do |p|
      FinancialTransaction.build_installment_part(
        user: user,
        description: "#{group[:display]} (#{p[:number]}/#{total})",
        amount: p[:amount] || 0, category: category, parent: root,
        installment_number: p[:number], due_date: p[:due], currency_code: CURRENCY,
        is_paid: p[:paid], bank_account_id: accounts[p[:account]]&.id,
        payment_method: p[:method], payment_date: p[:payment_date], notes: p[:notes]
      ).save!
      counts[:installment_parts] += 1
    end
  end

  # RECORRENTE -> template + ocorrências
  recurring_groups.each_value do |group|
    occ      = group[:occ].sort_by { |o| o[:due] }
    started  = occ.first[:due]
    template = occ.find { |o| o[:amount] }&.fetch(:amount) || 0

    root = FinancialTransaction.build_recurring_root(
      user: user, description: group[:display], amount: template, category: category,
      transaction_type: :expense, frequency: group[:freq], start_date: started,
      recurrence_end_date: nil, currency_code: CURRENCY
    )
    root.save!
    counts[:recurring_roots] += 1

    occ.each do |o|
      FinancialTransaction.build_recurring_occurrence(
        user: user, description: group[:display], amount: o[:amount] || 0,
        category: category, parent: root, transaction_type: :expense, date: o[:due],
        currency_code: CURRENCY, is_paid: o[:paid], bank_account_id: accounts[o[:account]]&.id,
        payment_method: o[:method], payment_date: o[:payment_date], notes: o[:notes]
      ).save!
      counts[:recurring_occurrences] += 1
    end
  end

  # AVULSA -> standalone
  standalones.each do |s|
    FinancialTransaction.build_standalone(
      user: user, description: s[:description], amount: s[:amount] || 0,
      category: category, transaction_type: :expense, date: s[:due], currency_code: CURRENCY,
      is_paid: s[:paid], bank_account_id: accounts[s[:account]]&.id,
      payment_method: s[:method], payment_date: s[:payment_date], notes: s[:notes]
    ).save!
    counts[:standalones] += 1
  end
end

# ── relatório ───────────────────────────────────────────────────────────────

puts "\n=== Importação concluída (user ##{user.id} #{user.email}, moeda #{CURRENCY}) ==="
puts "Contas bancárias (criadas/encontradas): #{counts[:bank_accounts]}"
puts "Compras parceladas (installment_root):  #{counts[:installment_roots]}"
puts "  Parcelas (installment_part):          #{counts[:installment_parts]}"
puts "Recorrentes (recurring_root):            #{counts[:recurring_roots]}"
puts "  Ocorrências (recurring_occurrence):    #{counts[:recurring_occurrences]}"
puts "Avulsas (standalone):                    #{counts[:standalones]}"
total = counts.values_at(:installment_roots, :installment_parts, :recurring_roots,
                         :recurring_occurrences, :standalones).sum
puts "Total de financial_transactions criadas: #{total}"

if skipped.any?
  puts "\n=== Linhas ignoradas (#{skipped.size}) ==="
  skipped.each { |ln, d, reason| puts "  L#{ln} #{d.inspect}: #{reason}" }
end
puts
