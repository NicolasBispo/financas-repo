import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useBanks, useUpdateSpreadsheetRow } from '@/hooks/use-finance'
import { toDateInputValue } from '@/lib/format'
import { normalizeAmountInput, parseFlexibleAmount } from '@/lib/parse-amount'
import { COMMON_CURRENCIES, type SpreadsheetRow } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { PaymentMethodSelect } from '@/components/finance/payment-method-select'
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

interface Props {
  row: SpreadsheetRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toIso(dateInput: string): string {
  return new Date(`${dateInput}T12:00:00`).toISOString()
}

export function SpreadsheetRowEditDialog({ row, open, onOpenChange }: Props) {
  const updateRow = useUpdateSpreadsheetRow()
  const banks = useBanks()
  const [debitName, setDebitName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [bankAccountId, setBankAccountId] = useState('none')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  useEffect(() => {
    if (row) {
      setDebitName(row.debitName)
      setDueDate(toDateInputValue(row.dueDate))
      setAmount(String(row.amount))
      setIsPaid(row.isPaid)
      setCurrency(row.currency)
      setBankAccountId(row.bankAccountId != null ? String(row.bankAccountId) : 'none')
      setPaymentDate(row.paymentDate ? toDateInputValue(row.paymentDate) : '')
      setPaymentMethod(row.paymentMethod ?? '')
    }
  }, [row])

  async function handleSave() {
    if (!row) return
    const numericAmount = parseFlexibleAmount(amount)
    if (!debitName.trim() || !numericAmount || numericAmount <= 0) return
    await updateRow.mutateAsync({
      id: row.id,
      payload: {
        debitName: debitName.trim(),
        dueDate: toIso(dueDate),
        amount: numericAmount,
        isPaid,
        currency,
        bankAccountId: bankAccountId === 'none' ? null : Number(bankAccountId),
        paymentDate: paymentDate ? toIso(paymentDate) : null,
        paymentMethod: paymentMethod.trim() || null,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="row-name">Descrição</Label>
            <Input id="row-name" value={debitName} onChange={(e) => setDebitName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="row-date">Vencimento</Label>
              <DateField id="row-date" value={dueDate} onChange={setDueDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="row-amount">Valor</Label>
              <Input
                id="row-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(normalizeAmountInput(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="row-payment-date">Data do pagamento</Label>
              <DateField id="row-payment-date" value={paymentDate} onChange={setPaymentDate} />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pagamento</Label>
              <PaymentMethodSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                onCommit={setPaymentMethod}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="space-y-1.5">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
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
            <label className="flex h-9 items-center gap-2 text-sm">
              <Checkbox
                checked={isPaid}
                onCheckedChange={(value) => {
                  const next = value === true
                  setIsPaid(next)
                  if (next && !paymentDate) {
                    setPaymentDate(toDateInputValue(new Date().toISOString()))
                  }
                  if (!next) setPaymentDate('')
                }}
              />
              Pago
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Banco</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem banco</SelectItem>
                {banks.data?.map((bank) => (
                  <SelectItem key={bank.id} value={String(bank.id)}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={updateRow.isPending}>
            {updateRow.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
