import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUpdateSpreadsheetRow } from '@/hooks/use-finance'
import { toDateInputValue } from '@/lib/format'
import { COMMON_CURRENCIES, type SpreadsheetRow } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

interface Props {
  row: SpreadsheetRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SpreadsheetRowEditDialog({ row, open, onOpenChange }: Props) {
  const updateRow = useUpdateSpreadsheetRow()
  const [debitName, setDebitName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    if (row) {
      setDebitName(row.debitName)
      setDueDate(toDateInputValue(row.dueDate))
      setAmount(String(row.amount))
      setIsPaid(row.isPaid)
      setCurrency(row.currency)
    }
  }, [row])

  async function handleSave() {
    if (!row) return
    await updateRow.mutateAsync({
      id: row.id,
      payload: {
        debitName: debitName.trim(),
        dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
        amount: Number(amount),
        isPaid,
        currency,
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
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              <Checkbox checked={isPaid} onCheckedChange={(value) => setIsPaid(value === true)} />
              Pago
            </label>
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
