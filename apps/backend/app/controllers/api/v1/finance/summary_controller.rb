# frozen_string_literal: true

module API
  module V1
    module Finance
      class SummaryController < BaseController
        def show
          start_at, end_at = period_bounds
          ledger = current_user.financial_transactions.ledger.in_period(start_at, end_at)

          income = ledger.income.sum(:amount)
          expense = ledger.expense.sum(:amount)
          installments = current_user.financial_transactions
                                     .where(kind: :installment_part)
                                     .in_period(start_at, end_at)
                                     .sum(:amount)

          render json: {
            totalIncome: income.to_f,
            totalPurchases: expense.to_f,
            totalFixedCosts: 0.0,
            totalInstallments: installments.to_f,
            balance: (income - expense).to_f,
            budgetProgress: 0.0,
            startDate: start_at.iso8601,
            endDate: end_at.iso8601
          }
        end
      end
    end
  end
end
