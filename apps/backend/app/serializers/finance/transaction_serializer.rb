# frozen_string_literal: true

module Finance
  # Mirrors the legacy TransactionResponseDto (camelCase keys, PascalCase enums).
  class TransactionSerializer
    def self.call(transaction)
      new(transaction).as_json
    end

    def initialize(transaction)
      @transaction = transaction
    end

    def as_json(*)
      t = @transaction
      {
        id: t.id,
        description: t.description,
        amount: t.amount.to_f,
        type: t.transaction_type.camelize,
        kind: t.kind.camelize,
        date: t.date.iso8601,
        category: t.transaction_category.name,
        categoryId: t.transaction_category_id,
        categoryColorHex: t.transaction_category.color_hex,
        categoryIcon: t.transaction_category.icon,
        parentTransactionId: t.parent_transaction_id,
        installmentNumber: t.installment_number,
        totalInstallments: t.total_installments,
        recurrenceFrequency: t.recurrence_label,
        isPaid: t.is_paid,
        currency: t.currency_code,
        creditCardId: t.credit_card_id,
        creditCardName: t.credit_card&.name,
        creditCardColorHex: t.credit_card&.color_hex
      }
    end
  end
end
