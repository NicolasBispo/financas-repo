# frozen_string_literal: true

# Finance domain: per-user categories, credit cards, bank accounts, settings and
# the transaction ledger (standalone / installment / recurring rows).
class CreateFinanceTables < ActiveRecord::Migration[8.1]
  def change
    create_table :transaction_categories do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :color_hex
      t.string :icon
      t.timestamps
    end
    add_index :transaction_categories, %i[user_id name], unique: true

    create_table :credit_cards do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :color_hex
      t.string :bank_name
      t.string :network_brand
      t.string :last_four_digits
      t.string :notes
      t.timestamps
    end

    create_table :bank_accounts do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :color_hex
      t.string :institution_name
      t.string :default_currency, null: false, default: 'USD'
      t.string :notes
      t.timestamps
    end

    create_table :finance_settings do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :default_currency, null: false, default: 'USD'
      t.timestamps
    end

    create_table :financial_transactions do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.references :transaction_category, null: false, foreign_key: true, index: true
      t.references :credit_card, foreign_key: true, index: true
      t.references :parent_transaction,
                   foreign_key: { to_table: :financial_transactions }, index: true

      t.string :description, null: false
      t.decimal :amount, precision: 14, scale: 2, null: false, default: 0
      t.datetime :date, null: false
      t.boolean :is_paid, null: false, default: false

      t.integer :transaction_type, null: false, default: 1
      t.integer :kind, null: false, default: 0

      t.integer :installment_number
      t.integer :total_installments

      t.integer :recurrence_frequency, null: false, default: 0
      t.datetime :recurrence_end_date

      t.string :currency_code, null: false, default: 'USD'

      t.timestamps
    end
    add_index :financial_transactions, %i[user_id date]
    add_index :financial_transactions, %i[user_id kind]
  end
end
