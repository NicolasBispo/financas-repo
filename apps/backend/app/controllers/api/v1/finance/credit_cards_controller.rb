# frozen_string_literal: true

module API
  module V1
    module Finance
      class CreditCardsController < BaseController
        def index
          cards = current_user.credit_cards.order(created_at: :desc)
          render json: cards.map { |c| ::Finance::CreditCardSerializer.call(c) }
        end

        def create
          card = current_user.credit_cards.create!(card_attributes)
          render json: ::Finance::CreditCardSerializer.call(card), status: :created
        end

        def update
          card = current_user.credit_cards.find(params[:id])
          card.update!(card_attributes)
          render json: ::Finance::CreditCardSerializer.call(card)
        end

        def destroy
          current_user.credit_cards.find(params[:id]).destroy!
          head :no_content
        end

        # GET /api/v1/finance/credit-cards/:id/summary?year&month
        def summary
          card = current_user.credit_cards.find(params[:id])
          start_at, end_at = month_bounds(params[:year], params[:month])

          rows = invoice_scope(card, start_at, end_at)
          total = rows.sum(:amount)
          paid = rows.where(is_paid: true).sum(:amount)
          remaining = [total - paid, 0].max

          render json: {
            creditCardId: card.id,
            creditCardName: card.name,
            periodStart: start_at.iso8601,
            periodEnd: end_at.iso8601,
            totalAmount: total.to_f,
            paidAmount: paid.to_f,
            remainingAmount: remaining.to_f,
            isPaid: total.positive? && remaining.zero?
          }
        end

        # GET /api/v1/finance/credit-cards/:id/transactions?year&month
        def transactions
          card = current_user.credit_cards.find(params[:id])
          start_at, end_at = month_bounds(params[:year], params[:month])

          rows = invoice_scope(card, start_at, end_at)
                 .includes(:transaction_category, :credit_card)
                 .order(:date)
          render json: rows.map { |t| ::Finance::TransactionSerializer.call(t) }
        end

        private

        def invoice_scope(card, start_at, end_at)
          current_user.financial_transactions
                      .where(credit_card_id: card.id, transaction_type: :expense)
                      .where(kind: FinancialTransaction::LEDGER_KINDS)
                      .in_period(start_at, end_at)
        end

        def card_attributes
          {
            name: :name,
            color_hex: :colorHex,
            bank_name: :bankName,
            network_brand: :networkBrand,
            last_four_digits: :lastFourDigits,
            notes: :notes
          }.each_with_object({}) do |(attr, key), attrs|
            attrs[attr] = params[key] if params.key?(key)
          end
        end
      end
    end
  end
end
