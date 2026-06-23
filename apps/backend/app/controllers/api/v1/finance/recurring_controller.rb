# frozen_string_literal: true

module API
  module V1
    module Finance
      class RecurringController < BaseController
        # POST /api/v1/finance/recurring
        def create
          frequency = parse_frequency(params[:frequency])
          raise ArgumentError, 'frequency is required' if frequency == :none

          type = parse_transaction_type(params[:type])
          category = resolve_category(category_id: params[:categoryId], category_name: params[:category])
          currency = resolve_currency_for_create(params[:currency])

          root = FinancialTransaction.build_recurring_root(
            user: current_user,
            description: params[:description].to_s,
            amount: params[:amount],
            category: category,
            transaction_type: type,
            frequency: frequency,
            start_date: parse_time(params[:startDate]) || Time.current,
            recurrence_end_date: parse_time(params[:recurrenceEndDate]),
            currency_code: currency
          )
          root.save!
          render json: ::Finance::TransactionSerializer.call(with_associations(root)), status: :created
        end

        # GET /api/v1/finance/recurring/pending?start&end
        def pending
          start_at, end_at = period_bounds
          templates = pending_templates(start_at, end_at)
          existing = existing_template_ids(templates.map(&:id), start_at, end_at)

          items = templates.reject { |t| existing.include?(t.id) }.map do |template|
            {
              templateId: template.id,
              description: template.description,
              category: template.transaction_category.name,
              suggestedAmount: template.amount.to_f,
              suggestedDueDay: template.date.day,
              type: template.transaction_type.camelize,
              frequency: template.recurrence_frequency.camelize
            }
          end
          render json: items
        end

        # POST /api/v1/finance/recurring/occurrence
        def occurrence
          template = current_user.financial_transactions
                                 .where(kind: :recurring_root)
                                 .find(params[:templateId])
          due_date = parse_time(params[:dueDate]) || Time.current

          if occurrence_exists?(template, due_date)
            raise ArgumentError, 'Recurring transaction already configured for this month.'
          end

          occurrence = FinancialTransaction.build_recurring_occurrence(
            user: current_user,
            description: template.description,
            amount: params[:amount],
            category: template.transaction_category,
            parent: template,
            transaction_type: template.transaction_type,
            date: due_date,
            currency_code: template.currency_code
          )
          occurrence.save!
          render json: ::Finance::TransactionSerializer.call(with_associations(occurrence)),
                 status: :created
        end

        private

        def pending_templates(_start_at, end_at)
          current_user.financial_transactions
                      .where(kind: :recurring_root)
                      .where('date <= ?', end_at)
                      .where('recurrence_end_date IS NULL OR recurrence_end_date >= ?', _start_at)
                      .includes(:transaction_category)
                      .to_a
        end

        def existing_template_ids(template_ids, start_at, end_at)
          return [] if template_ids.empty?

          current_user.financial_transactions
                      .where(kind: :recurring_occurrence, parent_transaction_id: template_ids)
                      .in_period(start_at, end_at)
                      .distinct
                      .pluck(:parent_transaction_id)
        end

        def occurrence_exists?(template, due_date)
          current_user.financial_transactions
                      .where(kind: :recurring_occurrence, parent_transaction_id: template.id)
                      .in_period(due_date.beginning_of_month, due_date.end_of_month)
                      .exists?
        end
      end
    end
  end
end
