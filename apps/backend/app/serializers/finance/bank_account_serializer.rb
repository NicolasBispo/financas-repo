# frozen_string_literal: true

module Finance
  class BankAccountSerializer
    def self.call(account)
      new(account).as_json
    end

    def initialize(account)
      @account = account
    end

    def as_json(*)
      a = @account
      {
        id: a.id,
        name: a.name,
        colorHex: a.color_hex,
        institutionName: a.institution_name,
        defaultCurrency: a.default_currency,
        notes: a.notes,
        createdAtUtc: a.created_at.utc.iso8601
      }
    end
  end
end
