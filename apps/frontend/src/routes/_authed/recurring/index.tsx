import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  useCategories,
  useCreditCards,
  useBanks,
  useDeleteRecurring,
  useFinanceSettings,
  useRecurringPlans,
  useUpdateRecurring,
} from '@/hooks/use-finance'
import { formatCurrency, formatDate } from '@/lib/format'
import type { RecurringPlan } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { RecurringFormDialog } from '@/components/finance/recurring-form-dialog'
import { TransactionWizard } from '@/components/finance/transaction-wizard'

export const Route = createFileRoute('/_authed/recurring/')({
  component: RecurringPage,
})

const FREQUENCY_LABELS: Record<string, string> = {
  Daily: 'Diária',
  Weekly: 'Semanal',
  Monthly: 'Mensal',
  Yearly: 'Anual',
}

function RecurringPage() {
  const plans = useRecurringPlans()
  const categories = useCategories()
  const creditCards = useCreditCards()
  const banks = useBanks()
  const settings = useFinanceSettings()
  const deleteRecurring = useDeleteRecurring()
  const updateRecurring = useUpdateRecurring()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringPlan | null>(null)

  const currency = settings.data?.defaultCurrency ?? 'BRL'

  function openEdit(plan: RecurringPlan) {
    setEditing(plan)
    setDialogOpen(true)
  }

  function handleDelete(plan: RecurringPlan) {
    const message =
      plan.occurrenceCount > 0
        ? `Remover "${plan.description}"? Isso também apagará ${plan.occurrenceCount} lançamento(s) já registrado(s).`
        : `Remover "${plan.description}"?`
    if (window.confirm(message)) {
      deleteRecurring.mutate(plan.id)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recorrências</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os modelos de transações recorrentes. Remova cadastros incorretos que aparecem
            em{' '}
            <Link to="/dashboard" className="underline underline-offset-2">
              recorrências pendentes
            </Link>
            .
          </p>
        </div>
        <TransactionWizard
          categories={categories.data ?? []}
          creditCards={creditCards.data ?? []}
          banks={banks.data ?? []}
          defaultCurrency={currency}
          defaultMode="recurring"
          trigger={
            <Button>
              <Plus className="size-4" />
              Nova recorrência
            </Button>
          }
        />
      </div>

      {plans.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : plans.data && plans.data.length > 0 ? (
        <div className="space-y-3">
          {plans.data.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <RefreshCw className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{plan.description}</p>
                      {!plan.isActive ? (
                        <Badge variant="secondary">Encerrada</Badge>
                      ) : null}
                      {plan.isPaused ? <Badge variant="outline">Pausada</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.category} · {FREQUENCY_LABELS[plan.frequency] ?? plan.frequency} ·{' '}
                      {plan.type === 'Income' ? 'Receita' : 'Despesa'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Início {formatDate(plan.startDate)}
                      {plan.recurrenceEndDate ? ` · Fim ${formatDate(plan.recurrenceEndDate)}` : ''}
                      {plan.occurrenceCount > 0
                        ? ` · ${plan.occurrenceCount} lançamento(s)`
                        : ' · Nenhum lançamento'}
                      {plan.lastOccurrenceDate
                        ? ` · Último ${formatDate(plan.lastOccurrenceDate)}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(plan.amount, plan.currency)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {plan.isPaused ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateRecurring.isPending}
                        onClick={() =>
                          updateRecurring.mutate({ id: plan.id, payload: { recurrencePaused: false } })
                        }
                      >
                        Reativar
                      </Button>
                    ) : null}
                    <Button size="icon-sm" variant="ghost" onClick={() => openEdit(plan)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(plan)}
                      disabled={deleteRecurring.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Nenhuma recorrência cadastrada.
        </div>
      )}

      <RecurringFormDialog
        plan={editing}
        categories={categories.data ?? []}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
