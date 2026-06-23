# frozen_string_literal: true

module API
  module V1
    module Finance
      class BanksController < BaseController
        def index
          banks = current_user.bank_accounts.order(created_at: :desc)
          render json: banks.map { |b| ::Finance::BankAccountSerializer.call(b) }
        end

        def create
          bank = current_user.bank_accounts.create!(bank_attributes)
          render json: ::Finance::BankAccountSerializer.call(bank), status: :created
        end

        def update
          bank = current_user.bank_accounts.find(params[:id])
          bank.update!(bank_attributes)
          render json: ::Finance::BankAccountSerializer.call(bank)
        end

        def destroy
          current_user.bank_accounts.find(params[:id]).destroy!
          head :no_content
        end

        private

        def bank_attributes
          attrs = {}
          attrs[:name] = params[:name] if params.key?(:name)
          attrs[:color_hex] = params[:colorHex] if params.key?(:colorHex)
          attrs[:institution_name] = params[:institutionName] if params.key?(:institutionName)
          attrs[:default_currency] = params[:defaultCurrency] if params.key?(:defaultCurrency)
          attrs[:notes] = params[:notes] if params.key?(:notes)
          attrs
        end
      end
    end
  end
end
