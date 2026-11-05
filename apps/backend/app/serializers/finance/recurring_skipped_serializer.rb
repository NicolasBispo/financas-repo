# frozen_string_literal: true

module Finance
  class RecurringSkippedSerializer
    def self.call(skip)
      new(skip).as_json
    end

    def initialize(skip)
      @skip = skip
    end

    def as_json(*)
      template = @skip.recurring_template
      {
        id: @skip.id,
        templateId: template.id,
        description: template.description,
        category: template.transaction_category.name,
        suggestedAmount: template.amount.to_f,
        type: template.transaction_type.camelize,
        frequency: template.recurrence_frequency.camelize,
        year: @skip.period_year,
        month: @skip.period_month
      }
    end
  end
end
