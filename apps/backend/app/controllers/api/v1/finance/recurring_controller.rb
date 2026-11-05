# frozen_string_literal: true

module API
  module V1
    module Finance
      class RecurringController < BaseController
        # GET /api/v1/finance/recurring
        def index
          roots = current_user.financial_transactions
                              .where(kind: :recurring_root)
                              .includes(:transaction_category, :child_transactions)
                              .order(date: :desc)
          render json: roots.map { |root| ::Finance::RecurringPlanSerializer.call(root) }
        end

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

        # GET /api/v1/finance/recurring/skipped?start&end
        def skipped
          year, month = period_year_month
          skips = current_user.recurring_period_skips
                              .where(period_year: year, period_month: month)
                              .includes(recurring_template: :transaction_category)
                              .order(:created_at)
          render json: skips.map { |skip| ::Finance::RecurringSkippedSerializer.call(skip) }
        end

        # POST /api/v1/finance/recurring/skip
        def skip
          template = recurring_root_scope.find(params[:templateId])
          year, month = skip_year_month

          skip_record = current_user.recurring_period_skips.create!(
            recurring_template: template,
            period_year: year,
            period_month: month
          )
          render json: ::Finance::RecurringSkippedSerializer.call(
            current_user.recurring_period_skips
                        .includes(recurring_template: :transaction_category)
                        .find(skip_record.id)
          ), status: :created
        end

        # DELETE /api/v1/finance/recurring/skip/:id
        def unskip
          skip_record = current_user.recurring_period_skips.find(params[:id])
          skip_record.destroy!
          head :no_content
        end

        # GET /api/v1/finance/recurring/pending?start&end
        def pending
          start_at, end_at = period_bounds
          templates = pending_templates(start_at, end_at)
          covered = covered_template_ids(templates.map(&:id), start_at, end_at)

          items = templates.reject { |t| covered.include?(t.id) }.map do |template|
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
            currency_code: template.currency_code,
            bank_account_id: resolve_bank_account_id(params[:bankAccountId])
          )
          occurrence.save!
          render json: ::Finance::TransactionSerializer.call(with_associations(occurrence)),
                 status: :created
        end

        # PUT /api/v1/finance/recurring/:id
        def update
          root = recurring_root_scope.find(params[:id])
          apply_template_updates!(root)
          root.save!
          render json: ::Finance::RecurringPlanSerializer.call(
            with_recurring_associations(root)
          )
        end

        # DELETE /api/v1/finance/recurring/:id
        def destroy
          root = recurring_root_scope.find(params[:id])
          root.destroy!
          head :no_content
        end

        private

        def recurring_root_scope
          current_user.financial_transactions.where(kind: :recurring_root)
        end

        def with_recurring_associations(root)
          current_user.financial_transactions
                      .includes(:transaction_category, :child_transactions)
                      .find(root.id)
        end

        def apply_template_updates!(root)
          root.description = params[:description].to_s if params.key?(:description)
          root.amount = params[:amount] if params.key?(:amount)
          root.transaction_type = parse_transaction_type(params[:type]) if params.key?(:type)

          if params.key?(:frequency)
            frequency = parse_frequency(params[:frequency])
            raise ArgumentError, 'frequency is required' if frequency == :none

            root.recurrence_frequency = frequency
          end

          root.date = parse_time(params[:startDate]) if params.key?(:startDate)

          if params.key?(:recurrenceEndDate)
            root.recurrence_end_date = params[:recurrenceEndDate].present? ? parse_time(params[:recurrenceEndDate]) : nil
          end

          root.recurrence_paused = cast_boolean(params[:recurrencePaused]) if params.key?(:recurrencePaused)

          return unless params.key?(:categoryId) || params.key?(:category)

          root.transaction_category = resolve_category(
            category_id: params[:categoryId],
            category_name: params[:category]
          )
        end

        def pending_templates(_start_at, end_at)
          current_user.financial_transactions
                      .where(kind: :recurring_root, recurrence_paused: false)
                      .where('date <= ?', end_at)
                      .where('recurrence_end_date IS NULL OR recurrence_end_date >= ?', _start_at)
                      .includes(:transaction_category)
                      .to_a
        end

        def covered_template_ids(template_ids, start_at, end_at)
          return [] if template_ids.empty?

          existing = existing_template_ids(template_ids, start_at, end_at)
          skipped = skipped_template_ids(template_ids, start_at)
          (existing + skipped).uniq
        end

        def skipped_template_ids(template_ids, start_at)
          current_user.recurring_period_skips
                      .where(
                        recurring_template_id: template_ids,
                        period_year: start_at.year,
                        period_month: start_at.month
                      )
                      .pluck(:recurring_template_id)
        end

        def period_year_month
          start_at, = period_bounds
          [start_at.year, start_at.month]
        end

        def skip_year_month
          if params[:year].present? && params[:month].present?
            [params[:year].to_i, params[:month].to_i]
          else
            period_year_month
          end
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
