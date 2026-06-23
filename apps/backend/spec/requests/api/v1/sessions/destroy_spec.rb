# frozen_string_literal: true

describe 'DELETE /api/v1/auth/sign_out' do
  let(:user) { create(:user) }

  context 'with a valid token' do
    it 'returns a successful response' do
      delete destroy_user_session_path, headers: auth_headers, as: :json
      expect(response).to have_http_status(:no_content)
    end

    it 'revokes the token (adds its jti to the denylist)' do
      headers = auth_headers
      expect {
        delete destroy_user_session_path, headers:, as: :json
      }.to change(JwtDenylist, :count).by(1)
    end
  end

  context 'without a valid token' do
    it 'does not revoke anything' do
      expect {
        delete destroy_user_session_path, headers: {}, as: :json
      }.not_to change(JwtDenylist, :count)
    end
  end
end
