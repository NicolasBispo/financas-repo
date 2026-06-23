# frozen_string_literal: true

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

describe User do
  describe 'validations' do
    subject { build(:user) }

    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_presence_of(:email) }
  end

  describe '#full_name' do
    context 'when the user has no first name' do
      let(:user) { create(:user, first_name: '') }

      it 'falls back to the username' do
        expect(user.full_name).to eq(user.username)
      end
    end

    context 'when the user has a first name' do
      let(:user) { create(:user, first_name: 'John', last_name: 'Doe') }

      it 'returns the full name' do
        expect(user.full_name).to eq('John Doe')
      end
    end
  end

  describe '#jwt_payload' do
    let(:user) { create(:user, first_name: 'John', last_name: 'Doe') }

    it 'includes the email and name' do
      expect(user.jwt_payload).to include('email' => user.email, 'name' => 'John Doe')
    end
  end
end
