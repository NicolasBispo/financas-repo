import { useState } from 'react'
import { Loader2, MoreHorizontal } from 'lucide-react'
import {
  useCreateRecurringOccurrence,
  useSkipRecurringPeriod,
  useUpdateRecurring,
} from '@/hooks/use-finance'
import { normalizeAmountInput, parseFlexibleAmount } from '@/lib/parse-amount'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BankAccount, RecurringPendingItem } from '@/types/finance'

interface RecurringPendingListProps {
  items?: RecurringPendingItem[]
  isLoading: boolean
  year: number
  month: number
  banks?: BankAccount[]
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function defaultDueDate(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate()
  const safeDay = Math.min(Math.max(day, 1), lastDay)
  return `${year}-${pad2(month)}-${pad2(safeDay)}`
}

function endOfMonthIso(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate()
  return new Date(`${year}-${pad2(month)}-${pad2(lastDay)}T23:59:59`).toISOString()
}

function PendingRow({
  item,
  year,
  month,
  banks,
}: {
  item: RecurringPendingItem
  year: number
  month: number
  banks: BankAccount[]
}) {
  const createOccurrence = useCreateRecurringOccurrence()
  const skipPeriod = useSkipRecurringPeriod()
  const updateRecurring = useUpdateRecurring()

  const [amount, setAmount] = useState(String(item.suggestedAmount))
  const [dueDate, setDueDate] = useState(defaultDueDate(year, month, item.suggestedDueDay))
  const [bankAccountId, setBankAccountId] = useState('none')

  const numericAmount = parseFlexibleAmount(amount)
  const canLaunch = numericAmount > 0 && Boolean(dueDate)
  const isBusy = createOccurrence.isPending || skipPeriod.isPending || updateRecurring.isPending

  function launch() {
    createOccurrence.mutate({
      templateId: item.templateId,
      amount: numericAmount,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      bankAccountId: bankAccountId === 'none' ? null : Number(bankAccountId),
    })
  }

  function ignoreMonth() {
    skipPeriod.mutate({ templateId: item.templateId, year, month })
  }

  function pauseRecurring() {
    updateRecurring.mutate({ id: item.templateId, payload: { recurrencePaused: true } })
  }

  function finalizeRecurring() {
    if (!window.confirm(`Finalizar "${item.description}"? Ela não aparecerá em meses futuros.`)) return
    updateRecurring.mutate({
      id: item.templateId,
      payload: { recurrenceEndDate: endOfMonthIso(year, month) },
    })
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.description}</p>
          <p className="text-xs text-muted-foreground">
            {item.category} · {item.type === 'Income' ? 'Receita' : 'Despesa'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" disabled={isBusy}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={ignoreMonth}>Ignorar neste mês</DropdownMenuItem>
            <DropdownMenuItem onClick={pauseRecurring}>Pausar recorrência</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={finalizeRecurring}>
              Finalizar recorrência
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Vencimento</Label>
          <DateField value={dueDate} onChange={setDueDate} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Valor</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(normalizeAmountInput(event.target.value))}
          />
        </div>
        <Button size="sm" variant="outline" disabled={isBusy || !canLaunch} onClick={launch}>
          {createOccurrence.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Lançar
        </Button>
      </div>
      {banks.length > 0 ? (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Banco</Label>
          <Select value={bankAccountId} onValueChange={setBankAccountId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Sem banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem banco</SelectItem>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={String(bank.id)}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </li>
  )
}

export function RecurringPendingList({
  items,
  isLoading,
  year,
  month,
  banks = [],
}: RecurringPendingListProps) {
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
        <PendingRow key={item.templateId} item={item} year={year} month={month} banks={banks} />
      ))}
    </ul>
  )
}
