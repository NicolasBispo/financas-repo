import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUpdateRecurring } from '@/hooks/use-finance'
import { toDateInputValue } from '@/lib/format'
import { normalizeAmountInput, parseFlexibleAmount } from '@/lib/parse-amount'
import type { Category, RecurringPlan, RecurrenceFrequency } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FREQUENCIES: RecurrenceFrequency[] = ['Daily', 'Weekly', 'Monthly', 'Yearly']
const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  Daily: 'Diária',
  Weekly: 'Semanal',
  Monthly: 'Mensal',
  Yearly: 'Anual',
}

function toIso(dateInput: string): string {
  return new Date(`${dateInput}T12:00:00`).toISOString()
}

interface Props {
  plan: RecurringPlan | null
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecurringFormDialog({ plan, categories, open, onOpenChange }: Props) {
  const updateRecurring = useUpdateRecurring()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'Income' | 'Expense'>('Expense')
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('Monthly')
  const [startDate, setStartDate] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [categoryId, setCategoryId] = useState('')

  useEffect(() => {
    if (open && plan) {
      setDescription(plan.description)
      setAmount(String(plan.amount))
      setType(plan.type)
      setFrequency(plan.frequency)
      setStartDate(toDateInputValue(plan.startDate))
      setRecurrenceEndDate(plan.recurrenceEndDate ? toDateInputValue(plan.recurrenceEndDate) : '')
      setCategoryId(String(plan.categoryId))
    }
  }, [open, plan])

  async function handleSave() {
    if (!plan) return

    await updateRecurring.mutateAsync({
      id: plan.id,
      payload: {
        description: description.trim(),
        amount: parseFlexibleAmount(amount),
        type,
        frequency,
        startDate: toIso(startDate),
        recurrenceEndDate: recurrenceEndDate ? toIso(recurrenceEndDate) : null,
        categoryId: Number(categoryId),
      },
    })
    onOpenChange(false)
  }

  const numericAmount = parseFlexibleAmount(amount)
  const canSave = description.trim().length > 0 && numericAmount > 0 && Boolean(startDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar recorrência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recurring-description">Descrição</Label>
            <Input
              id="recurring-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recurring-amount">Valor</Label>
              <Input
                id="recurring-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(normalizeAmountInput(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Movimento</Label>
              <Select value={type} onValueChange={(value) => setType(value as 'Income' | 'Expense')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense">Despesa</SelectItem>
                  <SelectItem value="Income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Frequência</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setFrequency(value as RecurrenceFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FREQUENCY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início</Label>
              <DateField value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim (opcional)</Label>
              <DateField value={recurrenceEndDate} onChange={setRecurrenceEndDate} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Defina uma data de fim para encerrar a recorrência sem removê-la do histórico.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={updateRecurring.isPending || !canSave}>
            {updateRecurring.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
