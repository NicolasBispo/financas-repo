import { ChevronDown } from 'lucide-react'
import type { BankAccount } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type BankFilterValue = number | 'none'

interface Props {
  banks: BankAccount[]
  selected: BankFilterValue[]
  onChange: (values: BankFilterValue[]) => void
}

function labelForSelection(selected: BankFilterValue[], banks: BankAccount[]): string {
  if (selected.length === 0) return 'Todos os bancos'

  const names = selected.map((value) => {
    if (value === 'none') return 'Sem banco'
    return banks.find((bank) => bank.id === value)?.name ?? String(value)
  })

  if (names.length <= 2) return names.join(', ')
  return `${names.length} bancos`
}

export function BankMultiSelect({ banks, selected, onChange }: Props) {
  function toggle(value: BankFilterValue) {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-48 justify-between font-normal">
          <span className="truncate">{labelForSelection(selected, banks)}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
            <Checkbox
              checked={selected.includes('none')}
              onCheckedChange={() => toggle('none')}
            />
            <Label className="cursor-pointer font-normal">Sem banco</Label>
          </label>
          {banks.map((bank) => (
            <label
              key={bank.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <Checkbox
                checked={selected.includes(bank.id)}
                onCheckedChange={() => toggle(bank.id)}
              />
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: bank.colorHex ?? 'var(--primary)' }}
              />
              <Label className="cursor-pointer truncate font-normal">{bank.name}</Label>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
