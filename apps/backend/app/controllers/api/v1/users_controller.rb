# frozen_string_literal: true

module API
  module V1
    class UsersController < API::V1::APIController
      def show
        authorize current_user
        render json: { user: UserSerializer.call(current_user) }
      end

      def update
        authorize current_user
        current_user.update!(update_user_params)
        render json: { user: UserSerializer.call(current_user) }
      end

      private

      def update_user_params
        params.expect(user: %i[username first_name last_name email])
      end
    end
  end
end
