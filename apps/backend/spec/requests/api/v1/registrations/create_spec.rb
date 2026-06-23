# frozen_string_literal: true

describe 'POST /api/v1/auth/sign_up' do
  subject { post user_registration_path, params:, as: :json }

  let(:params) do
    {
      user: {
        email: 'email@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        username: 'username',
        first_name: 'first name',
        last_name: 'last name'
      }
    }
  end

  context 'with correct params' do
    before { subject }

    it_behaves_like 'there must not be a Set-Cookie in Header'
    it_behaves_like 'does not check authenticity token'

    it 'returns created' do
      expect(response).to have_http_status(:created)
    end

    it 'returns the user' do
      user = User.last
      expect(json[:user][:id]).to eq(user.id)
      expect(json[:user][:email]).to eq(params.dig(:user, :email))
      expect(json[:user][:username]).to eq(params.dig(:user, :username))
      expect(json[:user][:first_name]).to eq(params.dig(:user, :first_name))
      expect(json[:user][:last_name]).to eq(params.dig(:user, :last_name))
    end

    it 'returns a Bearer JWT in the Authorization header' do
      expect(response.headers['Authorization']).to match(/\ABearer .+/)
    end
  end

  context 'with incorrect params' do
    let(:params) do
      {
        user: {
          email: 'email@example.com',
          password: 'password123',
          password_confirmation: 'wrong_password!'
        }
      }
    end

    it 'returns a client error' do
      subject
      expect(response).to be_client_error
    end

    it 'returns errors upon failure' do
      subject
      expect(json.to_s).to match("Password confirmation doesn't match Password")
    end
  end
end
