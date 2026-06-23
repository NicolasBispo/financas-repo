import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CreditCard as CreditCardIcon, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { useCreditCards, useDeleteCreditCard } from '@/hooks/use-finance'
import type { CreditCard } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCardFormDialog } from '@/components/finance/credit-card-form-dialog'

export const Route = createFileRoute('/_authed/credit-cards/')({
  component: CreditCardsPage,
})

function CreditCardsPage() {
  const cards = useCreditCards()
  const deleteCard = useDeleteCreditCard()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CreditCard | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(card: CreditCard) {
    setEditing(card)
    setDialogOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo cartão
        </Button>
      </div>

      {cards.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : cards.data && cards.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.data.map((card) => (
            <Card key={card.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex size-9 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: card.colorHex ?? 'var(--primary)' }}
                    >
                      <CreditCardIcon className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[card.bankName, card.networkBrand].filter(Boolean).join(' · ') || 'Cartão'}
                        {card.lastFourDigits ? ` · ****${card.lastFourDigits}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => openEdit(card)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => deleteCard.mutate(card.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/credit-cards/$cardId" params={{ cardId: String(card.id) }}>
                    <Receipt className="size-3.5" />
                    Ver fatura
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Nenhum cartão cadastrado. Clique em “Novo cartão” para começar.
        </div>
      )}

      <CreditCardFormDialog card={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
