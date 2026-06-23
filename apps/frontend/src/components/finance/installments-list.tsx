import { formatCurrency, formatDate } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { InstallmentPlan } from '@/types/finance'

interface InstallmentsListProps {
  plans?: InstallmentPlan[]
  isLoading: boolean
}

export function InstallmentsList({ plans, isLoading }: InstallmentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhum parcelamento ativo.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {plans.map((plan) => (
        <li key={plan.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{plan.description}</p>
            <p className="text-xs text-muted-foreground">
              {plan.remainingInstallments}/{plan.totalInstallments} restantes · próx.{' '}
              {formatDate(plan.nextPaymentDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{formatCurrency(plan.installmentAmount)}</p>
            <p className="text-xs text-muted-foreground">de {formatCurrency(plan.totalAmount)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
