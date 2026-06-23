import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { useMonth } from '@/hooks/use-month'
import { useBulkDelete, useBulkSetPaid, useDeleteSpreadsheetRow, useSpreadsheet } from '@/hooks/use-finance'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SpreadsheetRow } from '@/types/finance'
import { Badge } from '@/components/ui/badge'
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MonthSelector } from '@/components/finance/month-selector'
import { SpreadsheetRowEditDialog } from '@/components/finance/spreadsheet-row-edit-dialog'

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
  const { range, label, next, prev } = useMonth()
  const [paid, setPaid] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [type, setType] = useState<string>('all')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<SpreadsheetRow | null>(null)

  const filters = useMemo(
    () => ({
      start: range.start,
      end: range.end,
      paid: paid === 'all' ? undefined : paid,
      types: type === 'all' ? undefined : [type],
    }),
    [range.start, range.end, paid, type],
  )

  const spreadsheet = useSpreadsheet(filters)
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

  const selectedIds = [...selected]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar tudo" />
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-16 text-center">Pago</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className={cn(row.isOverdue && !row.isPaid && 'bg-destructive/5')}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={() => toggleRow(row.id)}
                        aria-label="Selecionar linha"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {row.creditCardColorHex ? (
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: row.creditCardColorHex }}
                          />
                        ) : null}
                        {row.debitType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-medium">{row.debitName}</TableCell>
                    <TableCell className={cn(row.isOverdue && !row.isPaid && 'text-destructive')}>
                      {formatDate(row.dueDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.amount, row.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={row.isPaid}
                        onCheckedChange={(value) =>
                          bulkSetPaid.mutate({ ids: [row.id], isPaid: value === true })
                        }
                        aria-label="Alternar pago"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditing(row)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => deleteRow.mutate(row.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SpreadsheetRowEditDialog
        row={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  )
}
