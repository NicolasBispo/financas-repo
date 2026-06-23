import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Transaction } from '@/types/finance'

interface TransactionListProps {
  transactions?: Transaction[]
  isLoading: boolean
  emptyLabel?: string
}

export function TransactionList({
  transactions,
  isLoading,
  emptyLabel = 'Nenhuma transação no período.',
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === 'Income'
        return (
          <li key={transaction.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: transaction.categoryColorHex ?? 'var(--muted-foreground)' }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{transaction.description}</p>
              <p className="truncate text-xs text-muted-foreground">
                {transaction.category} · {formatDate(transaction.date)}
                {transaction.creditCardName ? ` · ${transaction.creditCardName}` : ''}
                {transaction.installmentNumber && transaction.totalInstallments
                  ? ` · ${transaction.installmentNumber}/${transaction.totalInstallments}`
                  : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  isIncome ? 'text-emerald-600' : 'text-foreground',
                )}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
              {!transaction.isPaid ? (
                <Badge variant="secondary" className="text-[10px]">
                  Em aberto
                </Badge>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
