# frozen_string_literal: true

# == Schema Information
#
# Table name: bank_accounts
#
#  id               :bigint           not null, primary key
#  color_hex        :string
#  default_currency :string           default("USD"), not null
#  institution_name :string
#  name             :string           not null
#  notes            :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  user_id          :bigint           not null
#
# Indexes
#
#  index_bank_accounts_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :bank_account do
    user
    sequence(:name) { |n| "Account #{n}" }
    institution_name { 'Demo Bank' }
    default_currency { 'USD' }
  end
end
