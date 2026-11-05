# frozen_string_literal: true

class AddRecurringPeriodSkipsAndPause < ActiveRecord::Migration[8.1]
  def change
    add_column :financial_transactions, :recurrence_paused, :boolean, default: false, null: false

    create_table :recurring_period_skips do |t|
      t.references :user, null: false, foreign_key: true
      t.references :recurring_template, null: false, foreign_key: { to_table: :financial_transactions }
      t.integer :period_year, null: false
      t.integer :period_month, null: false
      t.timestamps
    end

    add_index :recurring_period_skips,
              %i[user_id recurring_template_id period_year period_month],
              unique: true,
              name: 'idx_recurring_skips_unique_period'
  end
end
