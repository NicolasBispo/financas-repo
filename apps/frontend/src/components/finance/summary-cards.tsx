import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { FinanceSummary } from '@/types/finance'

interface SummaryCardsProps {
  summary?: FinanceSummary
  currency: string
  isLoading: boolean
}

export function SummaryCards({ summary, currency, isLoading }: SummaryCardsProps) {
  const items = [
    {
      label: 'Saldo',
      value: summary?.balance ?? 0,
      icon: Wallet,
      accent: (summary?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-destructive',
    },
    { label: 'Receitas', value: summary?.totalIncome ?? 0, icon: ArrowUpRight, accent: 'text-emerald-600' },
    { label: 'Despesas', value: summary?.totalPurchases ?? 0, icon: ArrowDownLeft, accent: 'text-destructive' },
    { label: 'Parcelas', value: summary?.totalInstallments ?? 0, icon: CreditCard, accent: 'text-foreground' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{item.label}</span>
              <item.icon className="size-4" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <span className={cn('text-xl font-semibold tabular-nums', item.accent)}>
                {formatCurrency(item.value, currency)}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
