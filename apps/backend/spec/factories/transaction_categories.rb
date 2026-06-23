# frozen_string_literal: true

# == Schema Information
#
# Table name: transaction_categories
#
#  id         :bigint           not null, primary key
#  color_hex  :string
#  icon       :string
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_transaction_categories_on_user_id           (user_id)
#  index_transaction_categories_on_user_id_and_name  (user_id,name) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :transaction_category do
    user
    sequence(:name) { |n| "Category #{n}" }
    color_hex { '#22c55e' }
    icon { 'tag' }
  end
end
