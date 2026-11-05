import { useMemo, useState } from 'react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMonth } from '@/hooks/use-month'
import { useBulkDelete, useBulkSetPaid, useBanks, useDeleteSpreadsheetRow, useSpreadsheet } from '@/hooks/use-finance'
import type { SpreadsheetRow } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MonthSelector } from '@/components/finance/month-selector'
import { SpreadsheetEditableRow } from '@/components/finance/spreadsheet-editable-row'
import { BankMultiSelect, type BankFilterValue } from '@/components/finance/bank-multi-select'

const authedRoute = getRouteApi('/_authed')

export const Route = createFileRoute('/_authed/spreadsheet')({
  component: SpreadsheetPage,
})

const DEBIT_TYPES = ['Recorrente', 'Parcela', 'Cartão', 'Receita', 'Despesa']
const PAID_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagos' },
  { value: 'unpaid', label: 'Em aberto' },
]

function SpreadsheetPage() {
  const search = authedRoute.useSearch()
  const { range, label, next, prev } = useMonth(search)
  const [paid, setPaid] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [type, setType] = useState<string>('all')
  const [bankFilter, setBankFilter] = useState<BankFilterValue[]>([])
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const filters = useMemo(
    () => ({
      start: range.start,
      end: range.end,
      paid: paid === 'all' ? undefined : paid,
      types: type === 'all' ? undefined : [type],
      banks: bankFilter.length > 0 ? bankFilter : undefined,
      sort,
    }),
    [range.start, range.end, paid, type, bankFilter, sort],
  )

  const spreadsheet = useSpreadsheet(filters)
  const banks = useBanks()
  const bulkSetPaid = useBulkSetPaid()
  const bulkDelete = useBulkDelete()
  const deleteRow = useDeleteSpreadsheetRow()

  const rows = spreadsheet.data ?? []
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))
  }

  function toggleSort() {
    setSort((current) => (current === 'asc' ? 'desc' : 'asc'))
  }

  const selectedIds = [...selected]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Planilha</h1>
        <MonthSelector label={label} onPrev={prev} onNext={next} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={paid} onValueChange={(value) => setPaid(value as typeof paid)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAID_FILTERS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {DEBIT_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <BankMultiSelect banks={banks.data ?? []} selected={bankFilter} onChange={setBankFilter} />

        {selectedIds.length > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selecionado(s)</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkSetPaid.mutate({ ids: selectedIds, isPaid: true }, { onSuccess: () => setSelected(new Set()) })
              }
            >
              Marcar pago
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkSetPaid.mutate({ ids: selectedIds, isPaid: false }, { onSuccess: () => setSelected(new Set()) })
              }
            >
              Marcar aberto
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => bulkDelete.mutate(selectedIds, { onSuccess: () => setSelected(new Set()) })}
            >
              Excluir
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-emerald-500/30" /> Pago
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-amber-400/30" /> Em aberto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-red-500/30" /> Atrasado
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {spreadsheet.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum lançamento neste período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar tudo" />
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                        onClick={toggleSort}
                      >
                        Vencimento
                        {sort === 'asc' ? (
                          <ArrowUp className="size-3.5 text-muted-foreground" />
                        ) : (
                          <ArrowDown className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="w-40">Banco</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-16 text-center">Pago</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row: SpreadsheetRow) => (
                    <SpreadsheetEditableRow
                      key={row.id}
                      row={row}
                      banks={banks.data ?? []}
                      selected={selected.has(row.id)}
                      onToggleSelect={() => toggleRow(row.id)}
                      onDelete={() => deleteRow.mutate(row.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
