# frozen_string_literal: true

module API
  module V1
    class RegistrationsController < Devise::RegistrationsController
      include API::Concerns::ActAsAPIRequest

      respond_to :json
      protect_from_forgery with: :null_session

      private

      def sign_up_params
        params.expect(user: %i[email password password_confirmation username first_name last_name])
      end

      def respond_with(resource, _opts = {})
        if resource.persisted?
          # devise-jwt added the `Authorization` header on the dispatched request.
          render json: { user: UserSerializer.call(resource) }, status: :created
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
