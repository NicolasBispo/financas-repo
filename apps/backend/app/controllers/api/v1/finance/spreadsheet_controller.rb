# frozen_string_literal: true

module API
  module V1
    module Finance
      class SpreadsheetController < BaseController
        # GET /api/v1/finance/spreadsheet?start&end&types&categories&paid
        def index
          start_at, end_at = period_bounds
          scope = current_user.financial_transactions
                              .where(kind: FinancialTransaction::LEDGER_KINDS)
                              .in_period(start_at, end_at)
                              .includes(:transaction_category, :credit_card)
                              .ordered
          scope = scope.where(transaction_category_id: category_ids) if category_ids.any?

          rows = scope.map { |t| ::Finance::SpreadsheetRowSerializer.call(t) }
          rows = filter_by_type(rows)
          rows = filter_by_paid(rows)
          render json: rows
        end

        # PUT /api/v1/finance/spreadsheet/:id
        def update
          transaction = current_user.financial_transactions
                                    .includes(:transaction_category, :credit_card)
                                    .find(params[:id])
          transaction.update!(
            description: params[:debitName].to_s.strip,
            date: parse_time(params[:dueDate]) || transaction.date,
            amount: params[:amount],
            is_paid: cast_boolean(params[:isPaid]),
            currency_code: ::Finance::Currency.normalize(params[:currency])
          )
          render json: ::Finance::TransactionSerializer.call(transaction)
        end

        # DELETE /api/v1/finance/spreadsheet/:id
        def destroy
          current_user.financial_transactions.find_by(id: params[:id])&.destroy!
          head :no_content
        end

        # POST /api/v1/finance/spreadsheet/bulk-paid
        def bulk_paid
          current_user.financial_transactions
                      .where(id: bulk_ids)
                      .update_all(is_paid: cast_boolean(params[:isPaid]), updated_at: Time.current)
          head :no_content
        end

        # POST /api/v1/finance/spreadsheet/bulk-delete
        def bulk_delete
          current_user.financial_transactions.where(id: bulk_ids).destroy_all
          head :no_content
        end

        private

        def category_ids
          @category_ids ||= params[:categories].to_s.split(',').map(&:strip).reject(&:blank?)
        end

        def bulk_ids
          Array(params[:ids]).map(&:to_i).reject(&:zero?)
        end

        def filter_by_type(rows)
          return rows if params[:types].blank?

          types = params[:types].to_s.split(',').map(&:strip)
          rows.select { |row| types.include?(row[:debitType]) }
        end

        def filter_by_paid(rows)
          case params[:paid].to_s.strip.downcase
          when 'paid' then rows.select { |row| row[:isPaid] }
          when 'unpaid' then rows.reject { |row| row[:isPaid] }
          else rows
          end
        end
      end
    end
  end
end
