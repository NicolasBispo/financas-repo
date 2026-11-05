# frozen_string_literal: true

describe 'Finance recurring' do
  let(:user) { create(:user) }
  let(:category) { create(:transaction_category, user:) }

  def recurring_root(attrs = {})
    create(
      :financial_transaction,
      {
        user:,
        transaction_category: category,
        description: 'Internet',
        amount: 97.0,
        date: 1.month.ago,
        kind: :recurring_root,
        recurrence_frequency: :monthly,
        transaction_type: :expense,
        currency_code: 'BRL'
      }.merge(attrs)
    )
  end

  describe 'GET /api/v1/finance/recurring' do
    it 'requires authentication' do
      get '/api/v1/finance/recurring'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns only the current user recurring templates' do
      mine = recurring_root
      other_user = create(:user)
      other_category = create(:transaction_category, user: other_user)
      create(
        :financial_transaction,
        user: other_user,
        transaction_category: other_category,
        description: 'Other',
        amount: 10,
        date: Time.current,
        kind: :recurring_root,
        recurrence_frequency: :monthly
      )

      get '/api/v1/finance/recurring', headers: auth_headers

      expect(response).to have_http_status(:success)
      expect(json.map { |row| row[:id] }).to eq([mine.id])
      expect(json.first[:description]).to eq('Internet')
      expect(json.first[:frequency]).to eq('Monthly')
    end
  end

  describe 'PUT /api/v1/finance/recurring/:id' do
    it 'updates a recurring template' do
      root = recurring_root

      put "/api/v1/finance/recurring/#{root.id}",
          params: { description: 'Internet JP', amount: 100.0 },
          headers: auth_headers,
          as: :json

      expect(response).to have_http_status(:success)
      expect(json[:description]).to eq('Internet JP')
      expect(json[:amount]).to eq(100.0)
      expect(root.reload.description).to eq('Internet JP')
    end
  end

  describe 'DELETE /api/v1/finance/recurring/:id' do
    it 'removes the template and its occurrences' do
      root = recurring_root
      occurrence = create(
        :financial_transaction,
        user:,
        transaction_category: category,
        description: 'Internet',
        amount: 97.0,
        date: Time.current,
        kind: :recurring_occurrence,
        parent_transaction: root,
        transaction_type: :expense
      )

      expect {
        delete "/api/v1/finance/recurring/#{root.id}", headers: auth_headers
      }.to change(user.financial_transactions, :count).by(-2)

      expect(response).to have_http_status(:no_content)
      expect(FinancialTransaction.exists?(root.id)).to be(false)
      expect(FinancialTransaction.exists?(occurrence.id)).to be(false)
    end
  end
end
