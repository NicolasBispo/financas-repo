import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
  useCreateInstallment,
  useCreateRecurring,
  useCreateTransaction,
} from '@/hooks/use-finance'
import { addMonthsToDateInput, formatCurrency } from '@/lib/format'
import { COMMON_CURRENCIES, type Category, type CreditCard } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Mode = 'expense' | 'income' | 'installment' | 'recurring'

const MODES: { value: Mode; label: string }[] = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
  { value: 'installment', label: 'Parcelamento' },
  { value: 'recurring', label: 'Recorrente' },
]

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const
const FREQUENCY_LABELS: Record<string, string> = {
  Daily: 'Diária',
  Weekly: 'Semanal',
  Monthly: 'Mensal',
  Yearly: 'Anual',
}

// Sentinel value for the "create a new category" option in the category select.
const NEW_CATEGORY = '__new__'

interface Parcel {
  amount: string
  dueDate: string
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function toIso(dateInput: string): string {
  return new Date(`${dateInput}T12:00:00`).toISOString()
}

// Even split (last parcel absorbs the rounding remainder) with monthly due dates.
function buildParcels(total: number, count: number, startInput: string): Parcel[] {
  const safeCount = Math.max(1, Math.floor(count))
  const base = Math.round((total / safeCount) * 100) / 100
  const remainder = Math.round((total - base * safeCount) * 100) / 100
  return Array.from({ length: safeCount }, (_, index) => ({
    amount: (index === safeCount - 1 ? base + remainder : base).toFixed(2),
    dueDate: addMonthsToDateInput(startInput, index),
  }))
}

interface TransactionWizardProps {
  categories: Category[]
  creditCards: CreditCard[]
  defaultCurrency: string
  trigger?: ReactNode
}

export function TransactionWizard({
  categories,
  creditCards,
  defaultCurrency,
  trigger,
}: TransactionWizardProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('expense')

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [count, setCount] = useState('2')
  const [date, setDate] = useState(todayInput())
  const [currency, setCurrency] = useState(defaultCurrency)
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creditCardId, setCreditCardId] = useState('none')
  const [frequency, setFrequency] = useState('Monthly')
  const [recurringType, setRecurringType] = useState<'Income' | 'Expense'>('Expense')
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [error, setError] = useState<string | null>(null)

  const createTransaction = useCreateTransaction()
  const createInstallment = useCreateInstallment()
  const createRecurring = useCreateRecurring()
  const isPending =
    createTransaction.isPending || createInstallment.isPending || createRecurring.isPending

  const hasCategories = categories.length > 0
  const showCategoryInput = creatingCategory || !hasCategories

  // Recompute the installment schedule whenever the total, count or start date
  // change. Manual per-parcel edits live on top until one of these changes.
  useEffect(() => {
    if (mode !== 'installment') return
    const numericTotal = Number(amount)
    const parcelCount = Number(count)
    if (!numericTotal || numericTotal <= 0 || !parcelCount || parcelCount < 1) {
      setParcels([])
      return
    }
    setParcels(buildParcels(numericTotal, parcelCount, date))
  }, [mode, amount, count, date])

  function reset() {
    setMode('expense')
    setDescription('')
    setAmount('')
    setCount('2')
    setDate(todayInput())
    setCurrency(defaultCurrency)
    setCategoryId('')
    setCategoryName('')
    setCreatingCategory(false)
    setCreditCardId('none')
    setFrequency('Monthly')
    setRecurringType('Expense')
    setParcels([])
    setError(null)
  }

  function categoryFields() {
    if (showCategoryInput) {
      return { category: categoryName.trim() || undefined }
    }
    return { categoryId: categoryId ? Number(categoryId) : undefined }
  }

  function handleCategorySelect(value: string) {
    if (value === NEW_CATEGORY) {
      setCreatingCategory(true)
      setCategoryId('')
    } else {
      setCategoryId(value)
    }
  }

  function updateParcel(index: number, patch: Partial<Parcel>) {
    setParcels((current) =>
      current.map((parcel, i) => (i === index ? { ...parcel, ...patch } : parcel)),
    )
  }

  const parcelsTotal = parcels.reduce((sum, parcel) => sum + (Number(parcel.amount) || 0), 0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!description.trim()) return setError('Informe uma descrição.')

    const cardId = creditCardId !== 'none' ? Number(creditCardId) : undefined

    try {
      if (mode === 'installment') {
        if (parcels.length === 0) return setError('Informe o valor total e a quantidade de parcelas.')
        if (parcels.some((parcel) => !(Number(parcel.amount) > 0))) {
          return setError('Cada parcela precisa de um valor maior que zero.')
        }
        await createInstallment.mutateAsync({
          description: description.trim(),
          totalAmount: Number(parcelsTotal.toFixed(2)),
          count: parcels.length,
          startDate: toIso(parcels[0].dueDate),
          currency,
          creditCardId: cardId,
          installments: parcels.map((parcel) => ({
            amount: Number(parcel.amount),
            dueDate: toIso(parcel.dueDate),
          })),
          ...categoryFields(),
        })
      } else {
        const numericAmount = Number(amount)
        if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
          return setError('Informe um valor válido.')
        }
        if (mode === 'recurring') {
          await createRecurring.mutateAsync({
            description: description.trim(),
            amount: numericAmount,
            type: recurringType,
            frequency: frequency as 'Monthly',
            startDate: toIso(date),
            currency,
            ...categoryFields(),
          })
        } else {
          await createTransaction.mutateAsync({
            description: description.trim(),
            amount: numericAmount,
            type: mode === 'income' ? 'Income' : 'Expense',
            date: toIso(date),
            currency,
            creditCardId: mode === 'expense' ? cardId : undefined,
            ...categoryFields(),
          })
        }
      }
      reset()
      setOpen(false)
    } catch {
      /* errors are surfaced via the mutation's toast */
    }
  }

  const showCreditCard = mode === 'expense' || mode === 'installment'

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) reset()
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nova transação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
          <DialogDescription>Adicione um lançamento ao seu controle financeiro.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Descrição</Label>
            <Input
              id="tx-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: Supermercado"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">
                {mode === 'installment' ? 'Valor total' : 'Valor'}
              </Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            {mode === 'installment' ? (
              <div className="space-y-1.5">
                <Label htmlFor="tx-count">Parcelas</Label>
                <Input
                  id="tx-count"
                  type="number"
                  min="1"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Moeda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {mode === 'installment' ? (
            <div className="space-y-1.5">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {mode === 'recurring' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Movimento</Label>
                <Select
                  value={recurringType}
                  onValueChange={(value) => setRecurringType(value as 'Income' | 'Expense')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Expense">Despesa</SelectItem>
                    <SelectItem value="Income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {FREQUENCY_LABELS[freq]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">
                {mode === 'installment' || mode === 'recurring' ? 'Início' : 'Data'}
              </Label>
              <DateField id="tx-date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              {showCategoryInput ? (
                <div className="flex gap-2">
                  <Input
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="Nova categoria"
                  />
                  {hasCategories ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreatingCategory(false)
                        setCategoryName('')
                      }}
                    >
                      Cancelar
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Select value={categoryId} onValueChange={handleCategorySelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={NEW_CATEGORY}>+ Criar nova categoria</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {mode === 'installment' && parcels.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label>Parcelas ({parcels.length})</Label>
                <span className="text-xs text-muted-foreground">
                  Total: {formatCurrency(parcelsTotal, currency)}
                </span>
              </div>
              <div className="space-y-2">
                {parcels.map((parcel, index) => (
                  <div key={index} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{index + 1}.</span>
                    <DateField
                      value={parcel.dueDate}
                      onChange={(value) => updateParcel(index, { dueDate: value })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={parcel.amount}
                      onChange={(event) => updateParcel(index, { amount: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showCreditCard && creditCards.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Cartão (opcional)</Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cartão</SelectItem>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={String(card.id)}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
