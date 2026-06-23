# frozen_string_literal: true

module Finance
  class CreditCardSerializer
    def self.call(card)
      new(card).as_json
    end

    def initialize(card)
      @card = card
    end

    def as_json(*)
      c = @card
      {
        id: c.id,
        name: c.name,
        colorHex: c.color_hex,
        bankName: c.bank_name,
        networkBrand: c.network_brand,
        lastFourDigits: c.last_four_digits,
        notes: c.notes,
        createdAtUtc: c.created_at.utc.iso8601
      }
    end
  end
end
