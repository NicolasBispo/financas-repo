# frozen_string_literal: true

module Finance
  # Mirrors InstallmentPlanSerializer for recurring_root templates.
  class RecurringPlanSerializer
    def self.call(root)
      new(root).as_json
    end

    def initialize(root)
      @root = root
    end

    def as_json(*)
      occurrences = @root.child_transactions.sort_by(&:date)
      last_occurrence = occurrences.last
      today = Date.current
      end_date = @root.recurrence_end_date&.to_date
      active = end_date.nil? || end_date >= today

      {
        id: @root.id,
        description: @root.description,
        amount: @root.amount.to_f,
        type: @root.transaction_type.camelize,
        frequency: @root.recurrence_frequency.camelize,
        startDate: @root.date.iso8601,
        recurrenceEndDate: @root.recurrence_end_date&.iso8601,
        category: @root.transaction_category.name,
        categoryId: @root.transaction_category_id,
        currency: @root.currency_code,
        occurrenceCount: occurrences.size,
        lastOccurrenceDate: last_occurrence&.date&.iso8601,
        isActive: active,
        isPaused: @root.recurrence_paused
      }
    end
  end
end
