import type { SpreadsheetRow } from '@/types/finance'
import type { UpdateSpreadsheetRowPayload } from '@/lib/api/finance'

export function spreadsheetRowPayload(
  row: SpreadsheetRow,
  overrides: Partial<UpdateSpreadsheetRowPayload> = {},
): UpdateSpreadsheetRowPayload {
  return {
    debitName: row.debitName,
    dueDate: row.dueDate,
    amount: row.amount,
    isPaid: row.isPaid,
    currency: row.currency,
    bankAccountId: row.bankAccountId,
    paymentDate: row.paymentDate,
    paymentMethod: row.paymentMethod,
    ...overrides,
  }
}

export function spreadsheetRowStatusClass(row: SpreadsheetRow): string {
  if (row.isPaid) return 'bg-emerald-500/15'
  if (row.isOverdue) return 'bg-red-500/15'
  return 'bg-amber-400/15'
}
