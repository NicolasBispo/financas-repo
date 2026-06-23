import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { useBanks, useDeleteBank } from '@/hooks/use-finance'
import type { BankAccount } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BankFormDialog } from '@/components/finance/bank-form-dialog'

export const Route = createFileRoute('/_authed/banks/')({
  component: BanksPage,
})

function BanksPage() {
  const banks = useBanks()
  const deleteBank = useDeleteBank()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(bank: BankAccount) {
    setEditing(bank)
    setDialogOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bancos</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo banco
        </Button>
      </div>

      {banks.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : banks.data && banks.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {banks.data.map((bank) => (
            <Card key={bank.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex size-9 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: bank.colorHex ?? 'var(--primary)' }}
                  >
                    <Landmark className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">{bank.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bank.institutionName ?? 'Instituição não informada'} · {bank.defaultCurrency}
                    </p>
                    {bank.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{bank.notes}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(bank)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => deleteBank.mutate(bank.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Nenhum banco cadastrado. Clique em “Novo banco” para começar.
        </div>
      )}

      <BankFormDialog bank={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
