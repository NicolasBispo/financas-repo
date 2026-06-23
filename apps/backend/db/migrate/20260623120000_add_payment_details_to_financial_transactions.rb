# frozen_string_literal: true

# Adds the payment metadata that the spreadsheet import carries but the original
# ledger schema had no place for: which bank account paid, the payment method,
# the actual payment date and free-form notes.
class AddPaymentDetailsToFinancialTransactions < ActiveRecord::Migration[8.1]
  def change
    # Tabela pequena (app pessoal): assumimos o lock momentâneo da FK em vez de
    # quebrar em índice concorrente + validação separada.
    safety_assured do
      add_reference :financial_transactions, :bank_account,
                    foreign_key: true, index: true, null: true
    end

    add_column :financial_transactions, :payment_method, :string
    add_column :financial_transactions, :payment_date, :datetime
    add_column :financial_transactions, :notes, :text
  end
end
