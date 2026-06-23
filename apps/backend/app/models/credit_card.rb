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
class CreditCard < ApplicationRecord
  belongs_to :user
  has_many :financial_transactions, dependent: :nullify

  validates :name, presence: true

  before_validation :normalize_blanks

  private

  def normalize_blanks
    self.name = name.to_s.strip
    %i[color_hex bank_name network_brand last_four_digits notes].each do |attr|
      value = public_send(attr)
      public_send(:"#{attr}=", value.is_a?(String) ? value.strip.presence : value)
    end
  end
end
