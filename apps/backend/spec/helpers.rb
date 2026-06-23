# frozen_string_literal: true

module Helpers
  # Helper method to parse a response
  #
  # @return [Hash]
  def json
    JSON.parse(response.body).with_indifferent_access
  end

  # Builds a Bearer JWT for the given user (defaults to the `user` let).
  def auth_headers(target = user)
    token, = Warden::JWTAuth::UserEncoder.new.call(target, :user, nil)
    { 'Authorization' => "Bearer #{token}" }
  end
end
