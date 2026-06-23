import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMonth } from '@/hooks/use-month'
import { useCreditCardSummary, useCreditCardTransactions } from '@/hooks/use-finance'
import { formatCurrency } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MonthSelector } from '@/components/finance/month-selector'
import { TransactionList } from '@/components/finance/transaction-list'

export const Route = createFileRoute('/_authed/credit-cards/$cardId')({
  component: CardInvoicePage,
})

function CardInvoicePage() {
  const { cardId } = Route.useParams()
  const id = Number(cardId)
  const { year, month, label, next, prev } = useMonth()

  const summary = useCreditCardSummary(id, year, month)
  const transactions = useCreditCardTransactions(id, year, month)

  const stats = [
    { label: 'Total da fatura', value: summary.data?.totalAmount ?? 0 },
    { label: 'Pago', value: summary.data?.paidAmount ?? 0 },
    { label: 'Em aberto', value: summary.data?.remainingAmount ?? 0 },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/credit-cards">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {summary.data?.creditCardName ?? 'Fatura'}
            </h1>
            {summary.data ? (
              <Badge variant={summary.data.isPaid ? 'secondary' : 'outline'}>
                {summary.data.isPaid ? 'Fatura paga' : 'Fatura em aberto'}
              </Badge>
            ) : null}
          </div>
        </div>
        <MonthSelector label={label} onPrev={prev} onNext={next} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              {summary.isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-semibold tabular-nums">{formatCurrency(stat.value)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Lançamentos do período</h2>
        <TransactionList
          transactions={transactions.data}
          isLoading={transactions.isLoading}
          emptyLabel="Nenhum lançamento nesta fatura."
        />
      </div>
    </div>
  )
}
