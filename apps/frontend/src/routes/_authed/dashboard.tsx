import { createFileRoute } from '@tanstack/react-router'
import { useMonth } from '@/hooks/use-month'
import {
  useCategories,
  useCreditCards,
  useFinanceSettings,
  useInstallments,
  useRecurringPending,
  useSummary,
  useTransactions,
} from '@/hooks/use-finance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthSelector } from '@/components/finance/month-selector'
import { SummaryCards } from '@/components/finance/summary-cards'
import { TransactionList } from '@/components/finance/transaction-list'
import { InstallmentsList } from '@/components/finance/installments-list'
import { RecurringPendingList } from '@/components/finance/recurring-pending-list'
import { TransactionWizard } from '@/components/finance/transaction-wizard'
import { SettingsDialog } from '@/components/finance/settings-dialog'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { year, month, range, label, next, prev } = useMonth()

  const settings = useFinanceSettings()
  const summary = useSummary(range)
  const transactions = useTransactions(range)
  const installments = useInstallments()
  const recurring = useRecurringPending(range)
  const categories = useCategories()
  const creditCards = useCreditCards()

  const currency = settings.data?.defaultCurrency ?? 'USD'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector label={label} onPrev={prev} onNext={next} />
          <SettingsDialog />
          <TransactionWizard
            categories={categories.data ?? []}
            creditCards={creditCards.data ?? []}
            defaultCurrency={currency}
          />
        </div>
      </div>

      <SummaryCards summary={summary.data} currency={currency} isLoading={summary.isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={transactions.data} isLoading={transactions.isLoading} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parcelamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <InstallmentsList plans={installments.data} isLoading={installments.isLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recorrências pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecurringPendingList
                items={recurring.data}
                isLoading={recurring.isLoading}
                year={year}
                month={month}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
