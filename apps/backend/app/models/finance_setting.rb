# frozen_string_literal: true

# == Schema Information
#
# Table name: finance_settings
#
#  id               :bigint           not null, primary key
#  default_currency :string           default("USD"), not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  user_id          :bigint           not null
#
# Indexes
#
#  index_finance_settings_on_user_id  (user_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class FinanceSetting < ApplicationRecord
  belongs_to :user

  validates :user_id, uniqueness: true
  validates :default_currency, presence: true

  before_validation { self.default_currency = Finance::Currency.normalize(default_currency) }
end
