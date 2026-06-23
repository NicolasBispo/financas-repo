import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateCreditCard, useUpdateCreditCard } from '@/hooks/use-finance'
import type { CreditCard } from '@/types/finance'
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

interface Props {
  card: CreditCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditCardFormDialog({ card, open, onOpenChange }: Props) {
  const createCard = useCreateCreditCard()
  const updateCard = useUpdateCreditCard()
  const isEdit = card !== null

  const [name, setName] = useState('')
  const [bankName, setBankName] = useState('')
  const [networkBrand, setNetworkBrand] = useState('')
  const [lastFourDigits, setLastFourDigits] = useState('')
  const [colorHex, setColorHex] = useState('#6366f1')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setName(card?.name ?? '')
      setBankName(card?.bankName ?? '')
      setNetworkBrand(card?.networkBrand ?? '')
      setLastFourDigits(card?.lastFourDigits ?? '')
      setColorHex(card?.colorHex ?? '#6366f1')
      setNotes(card?.notes ?? '')
    }
  }, [open, card])

  async function handleSave() {
    const payload = {
      name: name.trim(),
      bankName: bankName.trim() || null,
      networkBrand: networkBrand.trim() || null,
      lastFourDigits: lastFourDigits.trim() || null,
      colorHex,
      notes: notes.trim() || null,
    }
    if (isEdit && card) {
      await updateCard.mutateAsync({ id: card.id, payload })
    } else {
      await createCard.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isPending = createCard.isPending || updateCard.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cartão' : 'Novo cartão'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="card-name">Nome</Label>
            <Input id="card-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-bank">Banco</Label>
              <Input id="card-bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-brand">Bandeira</Label>
              <Input id="card-brand" value={networkBrand} onChange={(e) => setNetworkBrand(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-last4">Final</Label>
              <Input
                id="card-last4"
                maxLength={4}
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value)}
                placeholder="1234"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-color">Cor</Label>
              <Input
                id="card-color"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-9 p-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-notes">Notas</Label>
            <Textarea id="card-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
