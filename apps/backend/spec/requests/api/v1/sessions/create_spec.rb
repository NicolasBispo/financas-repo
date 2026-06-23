# frozen_string_literal: true

describe 'POST /api/v1/auth/sign_in' do
  subject { post new_user_session_path, params:, as: :json }

  let(:password) { 'password123' }
  let(:user) { create(:user, password:) }
  let(:params) do
    {
      user: {
        email: user.email,
        password:
      }
    }
  end

  context 'with correct params' do
    before { subject }

    it_behaves_like 'there must not be a Set-Cookie in Header'
    it_behaves_like 'does not check authenticity token'

    it 'returns success' do
      expect(response).to be_successful
    end

    it 'returns the user' do
      expect(json[:user][:id]).to eq(user.id)
      expect(json[:user][:email]).to eq(user.email)
      expect(json[:user][:username]).to eq(user.username)
      expect(json[:user][:first_name]).to eq(user.first_name)
      expect(json[:user][:last_name]).to eq(user.last_name)
    end

    it 'returns a Bearer JWT in the Authorization header' do
      expect(response.headers['Authorization']).to match(/\ABearer .+/)
    end
  end

  context 'with incorrect params' do
    let(:params) do
      {
        user: {
          email: user.email,
          password: 'wrong_password!'
        }
      }
    end

    it 'returns unauthorized' do
      subject
      expect(response).to be_unauthorized
    end

    it 'does not issue a token' do
      subject
      expect(response.headers['Authorization']).to be_nil
    end
  end
end
