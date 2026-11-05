# frozen_string_literal: true

class RecurringPeriodSkip < ApplicationRecord
  belongs_to :user
  belongs_to :recurring_template, class_name: 'FinancialTransaction'

  validates :period_year, presence: true
  validates :period_month, inclusion: { in: 1..12 }
  validates :recurring_template_id, uniqueness: {
    scope: %i[user_id period_year period_month],
    message: 'already skipped for this period'
  }

  validate :recurring_template_must_be_root

  private

  def recurring_template_must_be_root
    return if recurring_template&.recurring_root?

    errors.add(:recurring_template, 'must be a recurring template')
  end
end
