# frozen_string_literal: true

describe 'Finance transactions' do
  let(:user) { create(:user) }
  let(:category) { create(:transaction_category, user:) }

  describe 'GET /api/v1/finance/transactions' do
    it 'requires authentication' do
      get '/api/v1/finance/transactions'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns only the current user ledger entries' do
      mine = create(:financial_transaction, user:, transaction_category: category, date: Time.current)
      create(:financial_transaction) # another user

      get '/api/v1/finance/transactions',
          params: { start: 1.month.ago.iso8601, end: 1.month.from_now.iso8601 },
          headers: auth_headers

      expect(response).to have_http_status(:success)
      expect(json.map { |row| row[:id] }).to eq([mine.id])
    end
  end

  describe 'POST /api/v1/finance/transaction' do
    let(:params) do
      {
        description: 'Coffee',
        amount: 12.5,
        type: 'Expense',
        categoryId: category.id,
        currency: 'USD'
      }
    end

    it 'creates a standalone transaction for the current user' do
      expect {
        post '/api/v1/finance/transaction', params:, headers: auth_headers, as: :json
      }.to change(user.financial_transactions, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json[:description]).to eq('Coffee')
      expect(json[:type]).to eq('Expense')
      expect(json[:kind]).to eq('Standalone')
      expect(json[:categoryId]).to eq(category.id)
    end
  end
end
