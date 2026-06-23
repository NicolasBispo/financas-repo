# frozen_string_literal: true

# Plain serializer for the authenticated user payload returned by the auth and
# user endpoints. Kept intentionally small — JWT identity claims are read by the
# frontend from the token, this is the canonical profile representation.
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
class UserSerializer
  def self.call(user)
    new(user).as_json
  end

  def initialize(user)
    @user = user
  end

  def as_json(*)
    {
      id: @user.id,
      email: @user.email,
      name: @user.full_name,
      username: @user.username,
      first_name: @user.first_name,
      last_name: @user.last_name,
      created_at: @user.created_at,
      updated_at: @user.updated_at
    }
  end
end
