# frozen_string_literal: true

module API
  module V1
    module Finance
      class TransactionsController < BaseController
        # GET /api/v1/finance/transactions?start&end&categories
        def index
          start_at, end_at = period_bounds
          scope = current_user.financial_transactions
                              .ledger
                              .in_period(start_at, end_at)
                              .includes(:transaction_category, :credit_card)
                              .ordered
          scope = scope.where(transaction_category_id: category_ids) if category_ids.any?
          render json: scope.map { |t| ::Finance::TransactionSerializer.call(t) }
        end

        # GET /api/v1/finance/transactions/:id
        def show
          transaction = current_user.financial_transactions
                                    .includes(:transaction_category, :credit_card)
                                    .find(params[:id])

          render json: {
            transaction: ::Finance::TransactionSerializer.call(transaction),
            installmentSiblings: installment_siblings(transaction)
          }
        end

        # POST /api/v1/finance/transaction(s)
        def create
          type = parse_transaction_type(params[:type])
          category = resolve_category(category_id: params[:categoryId], category_name: params[:category])
          currency = resolve_currency_for_create(params[:currency])
          credit_card_id = resolve_credit_card_id(type, params[:creditCardId])

          transaction = FinancialTransaction.build_standalone(
            user: current_user,
            description: params[:description].to_s,
            amount: params[:amount],
            category: category,
            transaction_type: type,
            date: parse_time(params[:date]) || Time.current,
            currency_code: currency,
            credit_card_id: credit_card_id,
            is_paid: params.key?(:isPaid) ? cast_boolean(params[:isPaid]) : nil
          )
          transaction.save!
          render json: ::Finance::TransactionSerializer.call(with_associations(transaction)),
                 status: :created
        end

        private

        def category_ids
          @category_ids ||= params[:categories].to_s.split(',').map(&:strip).reject(&:blank?)
        end

        def installment_siblings(transaction)
          return [] unless transaction.installment_part? && transaction.parent_transaction_id

          current_user.financial_transactions
                      .where(kind: :installment_part, parent_transaction_id: transaction.parent_transaction_id)
                      .includes(:transaction_category, :credit_card)
                      .order(:installment_number)
                      .map { |sibling| ::Finance::TransactionSerializer.call(sibling) }
        end
      end
    end
  end
end
