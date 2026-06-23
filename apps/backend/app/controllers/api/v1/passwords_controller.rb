# frozen_string_literal: true

module API
  module V1
    class PasswordsController < Devise::PasswordsController
      include API::Concerns::ActAsAPIRequest

      respond_to :json
      protect_from_forgery with: :null_session

      private

      # POST /api/v1/auth/password (request reset) and PUT (perform reset).
      # 202 on request avoids leaking which emails exist.
      def respond_with(resource, _opts = {})
        if resource.errors.empty?
          render json: { message: I18n.t('devise.passwords.send_instructions') }, status: :accepted
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
