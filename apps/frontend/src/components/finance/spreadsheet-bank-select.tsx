import { useUpdateSpreadsheetRow } from '@/hooks/use-finance'
import { spreadsheetRowPayload } from '@/lib/spreadsheet-row'
import type { BankAccount, SpreadsheetRow } from '@/types/finance'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  row: SpreadsheetRow
  banks: BankAccount[]
}

export function SpreadsheetBankSelect({ row, banks }: Props) {
  const updateRow = useUpdateSpreadsheetRow()
  const value = row.bankAccountId != null ? String(row.bankAccountId) : 'none'

  function handleChange(next: string) {
    updateRow.mutate({
      id: row.id,
      payload: spreadsheetRowPayload(row, {
        bankAccountId: next === 'none' ? null : Number(next),
      }),
    })
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={updateRow.isPending}>
      <SelectTrigger className="h-8 w-full min-w-32 max-w-40 border-dashed">
        <SelectValue placeholder="Banco" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sem banco</SelectItem>
        {banks.map((bank) => (
          <SelectItem key={bank.id} value={String(bank.id)}>
            <span className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: bank.colorHex ?? 'var(--primary)' }}
              />
              {bank.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
