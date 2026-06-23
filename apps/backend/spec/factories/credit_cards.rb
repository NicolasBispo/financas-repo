# frozen_string_literal: true

# == Schema Information
#
# Table name: credit_cards
#
#  id               :bigint           not null, primary key
#  bank_name        :string
#  color_hex        :string
#  last_four_digits :string
#  name             :string           not null
#  network_brand    :string
#  notes            :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  user_id          :bigint           not null
#
# Indexes
#
#  index_credit_cards_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :credit_card do
    user
    sequence(:name) { |n| "Card #{n}" }
    color_hex { '#6366f1' }
    bank_name { 'Demo Bank' }
    network_brand { 'Visa' }
    last_four_digits { '4242' }
  end
end
