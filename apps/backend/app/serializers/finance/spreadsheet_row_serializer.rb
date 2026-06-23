# frozen_string_literal: true

module Finance
  # Mirrors the legacy SpreadsheetTransactionRowDto.
  class SpreadsheetRowSerializer
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
        debitType: t.spreadsheet_debit_type,
        debitName: t.description,
        dueDate: t.date.iso8601,
        amount: t.amount.to_f,
        isPaid: t.is_paid,
        isOverdue: t.overdue?,
        currency: t.currency_code,
        categoryLabel: t.transaction_category.name,
        categoryColorHex: t.transaction_category.color_hex,
        creditCardLabel: t.credit_card&.name,
        creditCardColorHex: t.credit_card&.color_hex
      }
    end
  end
end
