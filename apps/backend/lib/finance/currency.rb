# frozen_string_literal: true

module Finance
  # ISO 4217 currency normalization + a best-effort region default derived from
  # the Accept-Language header (used when the user has no saved preference).
  module Currency
    DEFAULT = 'USD'
    COMMON = %w[USD BRL EUR GBP JPY ARS MXN CAD AUD].freeze

    module_function

    def normalize(code)
      normalized = code.to_s.strip.upcase
      normalized.length == 3 ? normalized : DEFAULT
    end

    def from_accept_language(header)
      lang = header.to_s.split(',').first.to_s.strip.downcase
      case lang
      when /\Apt-br/, /\Apt\z/ then 'BRL'
      when /\Aen-gb/ then 'GBP'
      when /\Aes-ar/ then 'ARS'
      when /\Aes-mx/ then 'MXN'
      when /\Aja/ then 'JPY'
      when /\Aen-ca/, /\Afr-ca/ then 'CAD'
      when /\Aen-au/ then 'AUD'
      when /\Ade/, /\Afr/, /\Aes/, /\Ait/, /\Apt-pt/, /\Anl/ then 'EUR'
      else DEFAULT
      end
    end
  end
end
