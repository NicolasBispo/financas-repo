# frozen_string_literal: true

module API
  module V1
    class SessionsController < Devise::SessionsController
      include API::Concerns::ActAsAPIRequest

      respond_to :json
      protect_from_forgery with: :null_session

      private

      def resource_params
        params.expect(user: %i[email password])
      end

      # On successful sign in devise-jwt has already added the `Authorization`
      # header to the response; we just render the user payload as the body.
      def respond_with(resource, _opts = {})
        render json: { user: UserSerializer.call(resource) }, status: :ok
      end

      def respond_to_on_destroy
        head :no_content
      end
    end
  end
end
