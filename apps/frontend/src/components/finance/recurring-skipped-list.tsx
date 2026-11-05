import { Loader2, RotateCcw } from 'lucide-react'
import { useUnskipRecurringPeriod } from '@/hooks/use-finance'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { RecurringSkippedItem } from '@/types/finance'

interface Props {
  items?: RecurringSkippedItem[]
  isLoading: boolean
  currency?: string
}

export function RecurringSkippedList({ items, isLoading, currency = 'BRL' }: Props) {
  const unskip = useUnskipRecurringPeriod()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Recorrências ignoradas neste mês</p>
      <ul className="divide-y divide-border rounded-lg border border-dashed border-border">
        {items.map((item) => (
          <SkippedRow key={item.id} item={item} currency={currency} unskip={unskip} />
        ))}
      </ul>
    </div>
  )
}

function SkippedRow({
  item,
  currency,
  unskip,
}: {
  item: RecurringSkippedItem
  currency: string
  unskip: ReturnType<typeof useUnskipRecurringPeriod>
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          {item.category} · {formatCurrency(item.suggestedAmount, currency)}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={unskip.isPending}
        onClick={() => unskip.mutate(item.id)}
      >
        {unskip.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-3.5" />}
        Reativar
      </Button>
    </li>
  )
}
