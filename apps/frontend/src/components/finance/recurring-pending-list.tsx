import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateRecurringOccurrence } from '@/hooks/use-finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { Skeleton } from '@/components/ui/skeleton'
import type { RecurringPendingItem } from '@/types/finance'

interface RecurringPendingListProps {
  items?: RecurringPendingItem[]
  isLoading: boolean
  year: number
  month: number
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

// Default due date (`yyyy-mm-dd`) for the suggested day within the current
// competence, clamped to the month's last day.
function defaultDueDate(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate()
  const safeDay = Math.min(Math.max(day, 1), lastDay)
  return `${year}-${pad2(month)}-${pad2(safeDay)}`
}

function PendingRow({
  item,
  year,
  month,
}: {
  item: RecurringPendingItem
  year: number
  month: number
}) {
  const createOccurrence = useCreateRecurringOccurrence()
  const [amount, setAmount] = useState(String(item.suggestedAmount))
  const [dueDate, setDueDate] = useState(defaultDueDate(year, month, item.suggestedDueDay))

  const numericAmount = Number(amount)
  const canLaunch = numericAmount > 0 && Boolean(dueDate)

  function launch() {
    createOccurrence.mutate({
      templateId: item.templateId,
      amount: numericAmount,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
    })
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.description}</p>
        <p className="text-xs text-muted-foreground">{item.category}</p>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Vencimento</Label>
          <DateField value={dueDate} onChange={setDueDate} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Valor</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={createOccurrence.isPending || !canLaunch}
          onClick={launch}
        >
          {createOccurrence.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Lançar
        </Button>
      </div>
    </li>
  )
}

export function RecurringPendingList({ items, isLoading, year, month }: RecurringPendingListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma recorrência pendente neste mês.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <PendingRow key={item.templateId} item={item} year={year} month={month} />
      ))}
    </ul>
  )
}
