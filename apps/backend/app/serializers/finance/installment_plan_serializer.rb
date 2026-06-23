# frozen_string_literal: true

module Finance
  # Mirrors the legacy InstallmentPlanResponseDto. Expects an installment_root
  # transaction with its child_transactions (parts) loaded.
  class InstallmentPlanSerializer
    def self.call(root)
      new(root).as_json
    end

    def initialize(root)
      @root = root
    end

    def as_json(*)
      parts = @root.child_transactions.sort_by { |p| p.installment_number || 0 }
      today = Date.current
      upcoming = parts.select { |p| p.date.to_date >= today }
      next_part = upcoming.min_by(&:date) || parts.last
      installment_amount = parts.first&.amount.to_f

      {
        id: @root.id,
        description: @root.description,
        totalAmount: @root.amount.to_f,
        installmentAmount: installment_amount,
        totalInstallments: @root.total_installments || parts.size,
        remainingInstallments: upcoming.size,
        startDate: @root.date.iso8601,
        nextPaymentDate: (next_part&.date || @root.date).iso8601
      }
    end
  end
end
