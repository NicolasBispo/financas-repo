import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useUpdateSpreadsheetRow } from '@/hooks/use-finance'
import { toDateInputValue } from '@/lib/format'
import { normalizeAmountInput, parseFlexibleAmount } from '@/lib/parse-amount'
import { spreadsheetRowPayload, spreadsheetRowStatusClass } from '@/lib/spreadsheet-row'
import type { BankAccount, SpreadsheetRow } from '@/types/finance'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/ui/date-field'
import { TableCell, TableRow } from '@/components/ui/table'
import { PaymentMethodSelect } from '@/components/finance/payment-method-select'
import { SpreadsheetBankSelect } from '@/components/finance/spreadsheet-bank-select'
import { cn } from '@/lib/utils'

interface Props {
  row: SpreadsheetRow
  banks: BankAccount[]
  selected: boolean
  onToggleSelect: () => void
  onDelete: () => void
}

function toIso(dateInput: string): string {
  return new Date(`${dateInput}T12:00:00`).toISOString()
}

function todayInputValue(): string {
  return toDateInputValue(new Date().toISOString())
}

export function SpreadsheetEditableRow({ row, banks, selected, onToggleSelect, onDelete }: Props) {
  const updateRow = useUpdateSpreadsheetRow()

  const [debitName, setDebitName] = useState(row.debitName)
  const [dueDate, setDueDate] = useState(toDateInputValue(row.dueDate))
  const [paymentDate, setPaymentDate] = useState(row.paymentDate ? toDateInputValue(row.paymentDate) : '')
  const [paymentMethod, setPaymentMethod] = useState(row.paymentMethod ?? '')
  const [amount, setAmount] = useState(String(row.amount))
  const [isPaid, setIsPaid] = useState(row.isPaid)

  useEffect(() => {
    setDebitName(row.debitName)
    setDueDate(toDateInputValue(row.dueDate))
    setPaymentDate(row.paymentDate ? toDateInputValue(row.paymentDate) : '')
    setPaymentMethod(row.paymentMethod ?? '')
    setAmount(String(row.amount))
    setIsPaid(row.isPaid)
  }, [row])

  function save(overrides: Parameters<typeof spreadsheetRowPayload>[1]) {
    updateRow.mutate({
      id: row.id,
      payload: spreadsheetRowPayload(row, overrides),
    })
  }

  function saveTextFields() {
    const numericAmount = parseFlexibleAmount(amount)
    if (!debitName.trim() || !numericAmount || numericAmount <= 0) return
    setAmount(String(numericAmount))
    save({
      debitName: debitName.trim(),
      amount: numericAmount,
      paymentMethod: paymentMethod.trim() || null,
    })
  }

  function togglePaid(nextPaid: boolean) {
    setIsPaid(nextPaid)
    if (nextPaid) {
      const today = todayInputValue()
      setPaymentDate(today)
      save({ isPaid: true, paymentDate: toIso(today) })
      return
    }
    setPaymentDate('')
    save({ isPaid: false, paymentDate: null })
  }

  return (
    <TableRow className={cn(spreadsheetRowStatusClass({ ...row, isPaid }))}>
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label="Selecionar linha" />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1">
          {row.creditCardColorHex ? (
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: row.creditCardColorHex }}
            />
          ) : null}
          {row.debitType}
        </Badge>
      </TableCell>
      <TableCell className="min-w-40">
        <Input
          className="h-8 border-transparent bg-transparent px-1 shadow-none focus-visible:border-input focus-visible:bg-background"
          value={debitName}
          onChange={(e) => setDebitName(e.target.value)}
          onBlur={saveTextFields}
          disabled={updateRow.isPending}
        />
      </TableCell>
      <TableCell className="min-w-32">
        <DateField
          className="border-transparent bg-transparent shadow-none focus-visible:border-input focus-visible:bg-background"
          value={dueDate}
          onChange={(value) => {
            setDueDate(value)
            save({ dueDate: toIso(value) })
          }}
        />
      </TableCell>
      <TableCell className="min-w-32">
        <DateField
          className="border-transparent bg-transparent shadow-none focus-visible:border-input focus-visible:bg-background"
          value={paymentDate}
          placeholder="—"
          onChange={(value) => {
            setPaymentDate(value)
            save({ paymentDate: value ? toIso(value) : null })
          }}
        />
      </TableCell>
      <TableCell className="min-w-36">
        <PaymentMethodSelect
          value={paymentMethod}
          onChange={setPaymentMethod}
          onCommit={(next) => save({ paymentMethod: next.trim() || null })}
          disabled={updateRow.isPending}
        />
      </TableCell>
      <TableCell>
        <SpreadsheetBankSelect row={row} banks={banks} />
      </TableCell>
      <TableCell className="min-w-24">
        <Input
          className="h-8 border-transparent bg-transparent px-1 text-right tabular-nums shadow-none focus-visible:border-input focus-visible:bg-background"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(normalizeAmountInput(e.target.value))}
          onBlur={saveTextFields}
          disabled={updateRow.isPending}
        />
      </TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={isPaid}
          onCheckedChange={(value) => togglePaid(value === true)}
          aria-label="Alternar pago"
          disabled={updateRow.isPending}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Button size="icon-sm" variant="ghost" onClick={onDelete} disabled={updateRow.isPending}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
