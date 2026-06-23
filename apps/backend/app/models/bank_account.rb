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
class BankAccount < ApplicationRecord
  belongs_to :user
  has_many :financial_transactions, dependent: :nullify

  validates :name, presence: true

  before_validation :normalize_attributes

  private

  def normalize_attributes
    self.name = name.to_s.strip
    self.default_currency = Finance::Currency.normalize(default_currency)
    %i[color_hex institution_name notes].each do |attr|
      value = public_send(attr)
      public_send(:"#{attr}=", value.is_a?(String) ? value.strip.presence : value)
    end
  end
end
