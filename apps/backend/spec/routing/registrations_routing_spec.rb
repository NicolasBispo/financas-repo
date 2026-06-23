# frozen_string_literal: true

describe API::V1::RegistrationsController do
  describe 'routing' do
    it 'routes to #create' do
      expect(post: '/api/v1/auth/sign_up').to route_to('api/v1/registrations#create', format: :json)
    end
  end
end
