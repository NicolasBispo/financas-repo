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
class TransactionCategory < ApplicationRecord
  belongs_to :user
  has_many :financial_transactions, dependent: :restrict_with_exception

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, case_sensitive: false }

  before_validation :normalize_blanks

  private

  def normalize_blanks
    self.name = name.to_s.strip
    self.color_hex = color_hex.presence
    self.icon = icon.presence
  end
end
