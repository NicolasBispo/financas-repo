import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateBank, useUpdateBank } from '@/hooks/use-finance'
import { COMMON_CURRENCIES, type BankAccount } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  bank: BankAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BankFormDialog({ bank, open, onOpenChange }: Props) {
  const createBank = useCreateBank()
  const updateBank = useUpdateBank()
  const isEdit = bank !== null

  const [name, setName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [colorHex, setColorHex] = useState('#6366f1')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setName(bank?.name ?? '')
      setInstitutionName(bank?.institutionName ?? '')
      setDefaultCurrency(bank?.defaultCurrency ?? 'USD')
      setColorHex(bank?.colorHex ?? '#6366f1')
      setNotes(bank?.notes ?? '')
    }
  }, [open, bank])

  async function handleSave() {
    const payload = {
      name: name.trim(),
      institutionName: institutionName.trim() || null,
      defaultCurrency,
      colorHex,
      notes: notes.trim() || null,
    }
    if (isEdit && bank) {
      await updateBank.mutateAsync({ id: bank.id, payload })
    } else {
      await createBank.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isPending = createBank.isPending || updateBank.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar banco' : 'Novo banco'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bank-name">Nome</Label>
            <Input id="bank-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-institution">Instituição</Label>
            <Input
              id="bank-institution"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moeda padrão</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
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
            <div className="space-y-1.5">
              <Label htmlFor="bank-color">Cor</Label>
              <Input
                id="bank-color"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-9 p-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-notes">Notas</Label>
            <Textarea id="bank-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || !name.trim()}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
