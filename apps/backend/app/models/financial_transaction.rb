# frozen_string_literal: true

# == Schema Information
#
# Table name: financial_transactions
#
#  id                      :bigint           not null, primary key
#  amount                  :decimal(14, 2)   default(0.0), not null
#  currency_code           :string           default("USD"), not null
#  date                    :datetime         not null
#  description             :string           not null
#  installment_number      :integer
#  is_paid                 :boolean          default(FALSE), not null
#  kind                    :integer          default("standalone"), not null
#  notes                   :text
#  payment_date            :datetime
#  payment_method          :string
#  recurrence_end_date     :datetime
#  recurrence_frequency    :integer          default("none"), not null
#  total_installments      :integer
#  transaction_type        :integer          default("expense"), not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  bank_account_id         :bigint
#  credit_card_id          :bigint
#  parent_transaction_id   :bigint
#  transaction_category_id :bigint           not null
#  user_id                 :bigint           not null
#
# Indexes
#
#  index_financial_transactions_on_bank_account_id          (bank_account_id)
#  index_financial_transactions_on_credit_card_id           (credit_card_id)
#  index_financial_transactions_on_parent_transaction_id    (parent_transaction_id)
#  index_financial_transactions_on_transaction_category_id  (transaction_category_id)
#  index_financial_transactions_on_user_id                  (user_id)
#  index_financial_transactions_on_user_id_and_date         (user_id,date)
#  index_financial_transactions_on_user_id_and_kind         (user_id,kind)
#
# Foreign Keys
#
#  fk_rails_...  (bank_account_id => bank_accounts.id)
#  fk_rails_...  (credit_card_id => credit_cards.id)
#  fk_rails_...  (parent_transaction_id => financial_transactions.id)
#  fk_rails_...  (transaction_category_id => transaction_categories.id)
#  fk_rails_...  (user_id => users.id)
#
class FinancialTransaction < ApplicationRecord
  belongs_to :user
  belongs_to :transaction_category
  belongs_to :credit_card, optional: true
  belongs_to :bank_account, optional: true
  belongs_to :parent_transaction, class_name: 'FinancialTransaction', optional: true,
                                   inverse_of: :child_transactions
  has_many :child_transactions, class_name: 'FinancialTransaction',
                                foreign_key: :parent_transaction_id,
                                inverse_of: :parent_transaction,
                                dependent: :destroy

  enum :transaction_type, { income: 0, expense: 1 }
  enum :kind, { standalone: 0, installment_root: 1, installment_part: 2,
                recurring_root: 3, recurring_occurrence: 4 }
  enum :recurrence_frequency, { none: 0, daily: 1, weekly: 2, monthly: 3, yearly: 4 },
       prefix: :recurrence

  # Kinds that represent a real, dated ledger entry (excludes roots/templates).
  LEDGER_KINDS = %w[standalone installment_part recurring_occurrence].freeze

  validates :description, presence: true
  validates :amount, presence: true
  validates :date, presence: true
  validates :currency_code, presence: true

  scope :ledger, -> { where(kind: LEDGER_KINDS) }
  scope :in_period, ->(start_at, end_at) { where(date: start_at..end_at) }
  scope :ordered, -> { order(:date) }

  # ── Builders (mirror the legacy domain factory methods) ──────────────────

  def self.build_standalone(user:, description:, amount:, category:, transaction_type:,
                            date:, currency_code:, credit_card_id: nil, is_paid: nil,
                            bank_account_id: nil, payment_method: nil, payment_date: nil,
                            notes: nil)
    paid = is_paid.nil? ? transaction_type.to_s == 'income' : is_paid
    new(user:, description:, amount:, transaction_category: category,
        transaction_type:, kind: :standalone, date:, currency_code:,
        credit_card_id:, is_paid: paid,
        bank_account_id:, payment_method:, payment_date:, notes:)
  end

  def self.build_installment_root(user:, description:, total_amount:, total_installments:,
                                 category:, start_date:, currency_code:, credit_card_id: nil)
    new(user:, description:, amount: total_amount, transaction_category: category,
        transaction_type: :expense, kind: :installment_root,
        total_installments:, date: start_date, is_paid: false,
        currency_code:, credit_card_id:)
  end

  def self.build_installment_part(user:, description:, amount:, category:, parent:,
                                 installment_number:, due_date:, currency_code:, credit_card_id: nil,
                                 is_paid: false, bank_account_id: nil, payment_method: nil,
                                 payment_date: nil, notes: nil)
    new(user:, description:, amount:, transaction_category: category,
        transaction_type: :expense, kind: :installment_part,
        parent_transaction: parent, installment_number:, date: due_date,
        is_paid:, currency_code:, credit_card_id:,
        bank_account_id:, payment_method:, payment_date:, notes:)
  end

  def self.build_recurring_root(user:, description:, amount:, category:, transaction_type:,
                               frequency:, start_date:, recurrence_end_date:, currency_code:)
    new(user:, description:, amount:, transaction_category: category,
        transaction_type:, kind: :recurring_root, recurrence_frequency: frequency,
        recurrence_end_date:, date: start_date, is_paid: false, currency_code:)
  end

  def self.build_recurring_occurrence(user:, description:, amount:, category:, parent:,
                                     transaction_type:, date:, currency_code:, is_paid: nil,
                                     bank_account_id: nil, payment_method: nil,
                                     payment_date: nil, notes: nil)
    paid = is_paid.nil? ? transaction_type.to_s == 'income' : is_paid
    new(user:, description:, amount:, transaction_category: category,
        transaction_type:, kind: :recurring_occurrence, parent_transaction: parent,
        date:, is_paid: paid, currency_code:,
        bank_account_id:, payment_method:, payment_date:, notes:)
  end

  # ── Derived helpers ──────────────────────────────────────────────────────

  def overdue?
    !is_paid? && date.to_date < Date.current
  end

  def recurrence_label
    recurrence_none? ? nil : recurrence_frequency.to_s.camelize
  end

  # Localized spreadsheet bucket label (matches the legacy categorization).
  def spreadsheet_debit_type
    case kind
    when 'recurring_occurrence' then 'Recorrente'
    when 'installment_part' then 'Parcela'
    else
      if credit_card_id.present?
        'Cartão'
      elsif income?
        'Receita'
      else
        'Despesa'
      end
    end
  end
end
