# frozen_string_literal: true

module API
  module V1
    module Finance
      class InstallmentsController < BaseController
        # GET /api/v1/finance/installments
        def index
          roots = current_user.financial_transactions
                              .where(kind: :installment_root)
                              .includes(:child_transactions)
                              .order(date: :desc)
          render json: roots.map { |root| ::Finance::InstallmentPlanSerializer.call(root) }
        end

        # POST /api/v1/finance/installments
        def create
          category = resolve_category(category_id: params[:categoryId], category_name: params[:category])
          currency = resolve_currency_for_create(params[:currency])
          credit_card_id = resolve_credit_card_id(:expense, params[:creditCardId])
          description = params[:description].to_s
          schedule = installment_schedule_param

          root =
            if schedule
              create_plan_from_schedule(description, category, currency, credit_card_id, schedule)
            else
              count = params[:count].to_i
              raise ArgumentError, 'count must be greater than or equal to 1' if count < 1

              start_date = parse_time(params[:startDate]) || Time.current
              total = params[:totalAmount].to_d
              create_plan(description, total, count, category, start_date, currency, credit_card_id)
            end

          render json: ::Finance::TransactionSerializer.call(with_associations(root)), status: :created
        end

        private

        # Per-installment amounts/due dates, when the client sends a custom
        # schedule instead of relying on the even split.
        def installment_schedule_param
          raw = params[:installments]
          return nil if raw.blank?

          schedule = raw.map do |entry|
            { amount: entry[:amount].to_d, due_date: parse_time(entry[:dueDate]) || Time.current }
          end
          raise ArgumentError, 'each installment requires an amount greater than zero' if schedule.any? { |e| e[:amount] <= 0 }

          schedule
        end

        def create_plan_from_schedule(description, category, currency, credit_card_id, schedule)
          count = schedule.length
          total = schedule.sum { |entry| entry[:amount] }
          start_date = schedule.first[:due_date]

          ApplicationRecord.transaction do
            root = FinancialTransaction.build_installment_root(
              user: current_user, description:, total_amount: total, total_installments: count,
              category:, start_date:, currency_code: currency, credit_card_id:
            )
            root.save!

            schedule.each_with_index do |entry, index|
              FinancialTransaction.build_installment_part(
                user: current_user,
                description: "#{description} (#{index + 1}/#{count})",
                amount: entry[:amount], category:, parent: root, installment_number: index + 1,
                due_date: entry[:due_date], currency_code: currency, credit_card_id:
              ).save!
            end

            root
          end
        end

        def create_plan(description, total, count, category, start_date, currency, credit_card_id)
          ApplicationRecord.transaction do
            root = FinancialTransaction.build_installment_root(
              user: current_user, description:, total_amount: total, total_installments: count,
              category:, start_date:, currency_code: currency, credit_card_id:
            )
            root.save!

            installment_amount = (total / count).round(2)
            remainder = total - (installment_amount * count)

            count.times do |index|
              value = index == count - 1 ? installment_amount + remainder : installment_amount
              FinancialTransaction.build_installment_part(
                user: current_user,
                description: "#{description} (#{index + 1}/#{count})",
                amount: value, category:, parent: root, installment_number: index + 1,
                due_date: start_date + index.months, currency_code: currency, credit_card_id:
              ).save!
            end

            root
          end
        end
      end
    end
  end
end
