# frozen_string_literal: true

module API
  module V1
    module Finance
      class SpreadsheetController < BaseController
        # GET /api/v1/finance/spreadsheet?start&end&types&categories&paid&banks&sort
        def index
          start_at, end_at = period_bounds
          scope = current_user.financial_transactions
                              .where(kind: FinancialTransaction::LEDGER_KINDS)
                              .in_period(start_at, end_at)
                              .includes(:transaction_category, :credit_card, :bank_account)
          scope = scope.where(transaction_category_id: category_ids) if category_ids.any?
          scope = filter_by_bank(scope)

          rows = scope.map { |t| ::Finance::SpreadsheetRowSerializer.call(t) }
          rows = filter_by_type(rows)
          rows = filter_by_paid(rows)
          rows = sort_rows(rows)
          render json: rows
        end

        # PUT /api/v1/finance/spreadsheet/:id
        def update
          transaction = current_user.financial_transactions
                                    .includes(:transaction_category, :credit_card, :bank_account)
                                    .find(params[:id])
          attrs = {
            description: params[:debitName].to_s.strip,
            date: parse_time(params[:dueDate]) || transaction.date,
            amount: params[:amount],
            is_paid: cast_boolean(params[:isPaid]),
            currency_code: ::Finance::Currency.normalize(params[:currency])
          }
          attrs[:bank_account_id] = resolve_bank_account_id(params[:bankAccountId]) if params.key?(:bankAccountId)
          if params.key?(:paymentMethod)
            attrs[:payment_method] = params[:paymentMethod].to_s.strip.presence&.upcase
          end
          if params.key?(:paymentDate)
            attrs[:payment_date] = params[:paymentDate].present? ? parse_time(params[:paymentDate]) : nil
          end
          transaction.update!(attrs)
          render json: ::Finance::TransactionSerializer.call(transaction)
        end

        # DELETE /api/v1/finance/spreadsheet/:id
        def destroy
          current_user.financial_transactions.find_by(id: params[:id])&.destroy!
          head :no_content
        end

        # POST /api/v1/finance/spreadsheet/bulk-paid
        def bulk_paid
          is_paid = cast_boolean(params[:isPaid])
          attrs = { is_paid: is_paid, updated_at: Time.current }
          attrs[:payment_date] = is_paid ? Time.current : nil
          current_user.financial_transactions
                      .where(id: bulk_ids)
                      .update_all(attrs)
          head :no_content
        end

        # POST /api/v1/finance/spreadsheet/bulk-delete
        def bulk_delete
          current_user.financial_transactions.where(id: bulk_ids).destroy_all
          head :no_content
        end

        # GET /api/v1/finance/spreadsheet/payment-methods
        def payment_methods
          methods = current_user.financial_transactions
                                .where.not(payment_method: [nil, ''])
                                .distinct
                                .pluck(:payment_method)
                                .map { |method| method.to_s.strip.upcase }
                                .uniq
                                .sort
          render json: methods
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

        def filter_by_bank(scope)
          raw = params[:banks].to_s.split(',').map(&:strip).reject(&:blank?)
          return scope if raw.empty?

          conditions = []
          if raw.delete('none')
            conditions << scope.where(bank_account_id: nil)
          end

          numeric_ids = raw.map(&:to_i).reject(&:zero?)
          conditions << scope.where(bank_account_id: numeric_ids) if numeric_ids.any?

          return scope.none if conditions.empty?

          conditions.reduce { |combined, condition| combined.or(condition) }
        end

        def sort_rows(rows)
          direction = params[:sort].to_s.strip.downcase
          return rows.sort_by { |row| row[:dueDate] } unless direction == 'desc'

          rows.sort_by { |row| row[:dueDate] }.reverse
        end
      end
    end
  end
end
