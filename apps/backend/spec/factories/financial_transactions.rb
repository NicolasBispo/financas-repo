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
FactoryBot.define do
  factory :financial_transaction do
    user
    transaction_category { association :transaction_category, user: }
    description { 'Groceries' }
    amount { 49.90 }
    date { Time.current }
    transaction_type { :expense }
    kind { :standalone }
    currency_code { 'USD' }
    is_paid { false }
  end
end
