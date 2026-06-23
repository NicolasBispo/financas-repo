# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :integer          not null, primary key
#  allow_password_change  :boolean          default(FALSE), not null
#  current_sign_in_at     :datetime
#  current_sign_in_ip     :inet
#  email                  :string
#  encrypted_password     :string           default(""), not null
#  first_name             :string           default("")
#  last_name              :string           default("")
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :inet
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  username               :string           default("")
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :trackable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :transaction_categories, dependent: :destroy
  has_many :credit_cards, dependent: :destroy
  has_many :bank_accounts, dependent: :destroy
  has_many :financial_transactions,
           class_name: 'FinancialTransaction', dependent: :destroy
  has_one :finance_setting, dependent: :destroy

  RANSACK_ATTRIBUTES = %w[id email first_name last_name username sign_in_count current_sign_in_at
                          last_sign_in_at current_sign_in_ip last_sign_in_ip
                          created_at updated_at].freeze

  def full_name
    return username if first_name.blank?

    "#{first_name} #{last_name}".strip
  end

  # Extra claims embedded in the JWT so the frontend can read basic identity
  # without an additional round-trip.
  def jwt_payload
    { 'email' => email, 'name' => full_name }
  end
end
