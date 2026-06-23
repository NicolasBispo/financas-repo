import { api } from './client'
import type {
  BankAccount,
  Category,
  CreditCard,
  CreditCardInvoiceSummary,
  FinanceSettings,
  FinanceSummary,
  InstallmentPlan,
  RecurringPendingItem,
  SpreadsheetRow,
  Transaction,
  TransactionDetail,
  TransactionType,
  RecurrenceFrequency,
} from '@/types/finance'

export interface PeriodRange {
  start: string
  end: string
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<FinanceSettings> {
  const { data } = await api.get('/finance/settings')
  return data
}

export async function updateSettings(defaultCurrency: string): Promise<FinanceSettings> {
  const { data } = await api.put('/finance/settings', { defaultCurrency })
  return data
}

// ── Summary ──────────────────────────────────────────────────────────────--

export async function getSummary(range: PeriodRange): Promise<FinanceSummary> {
  const { data } = await api.get('/finance/summary', { params: range })
  return data
}

// ── Categories ───────────────────────────────────────────────────────────--

export interface CategoryPayload {
  name: string
  colorHex?: string | null
  icon?: string | null
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/finance/categories')
  return data
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await api.post('/finance/categories', payload)
  return data
}

export async function updateCategory(id: number, payload: CategoryPayload): Promise<Category> {
  const { data } = await api.put(`/finance/categories/${id}`, payload)
  return data
}

// ── Credit cards ─────────────────────────────────────────────────────────--

export interface CreditCardPayload {
  name: string
  colorHex?: string | null
  bankName?: string | null
  networkBrand?: string | null
  lastFourDigits?: string | null
  notes?: string | null
}

export async function getCreditCards(): Promise<CreditCard[]> {
  const { data } = await api.get('/finance/credit-cards')
  return data
}

export async function createCreditCard(payload: CreditCardPayload): Promise<CreditCard> {
  const { data } = await api.post('/finance/credit-cards', payload)
  return data
}

export async function updateCreditCard(id: number, payload: CreditCardPayload): Promise<CreditCard> {
  const { data } = await api.put(`/finance/credit-cards/${id}`, payload)
  return data
}

export async function deleteCreditCard(id: number): Promise<void> {
  await api.delete(`/finance/credit-cards/${id}`)
}

export async function getCreditCardSummary(
  id: number,
  year: number,
  month: number,
): Promise<CreditCardInvoiceSummary> {
  const { data } = await api.get(`/finance/credit-cards/${id}/summary`, { params: { year, month } })
  return data
}

export async function getCreditCardTransactions(
  id: number,
  year: number,
  month: number,
): Promise<Transaction[]> {
  const { data } = await api.get(`/finance/credit-cards/${id}/transactions`, {
    params: { year, month },
  })
  return data
}

// ── Bank accounts ────────────────────────────────────────────────────────--

export interface BankPayload {
  name: string
  colorHex?: string | null
  institutionName?: string | null
  defaultCurrency?: string | null
  notes?: string | null
}

export async function getBanks(): Promise<BankAccount[]> {
  const { data } = await api.get('/finance/banks')
  return data
}

export async function createBank(payload: BankPayload): Promise<BankAccount> {
  const { data } = await api.post('/finance/banks', payload)
  return data
}

export async function updateBank(id: number, payload: BankPayload): Promise<BankAccount> {
  const { data } = await api.put(`/finance/banks/${id}`, payload)
  return data
}

export async function deleteBank(id: number): Promise<void> {
  await api.delete(`/finance/banks/${id}`)
}

// ── Transactions ─────────────────────────────────────────────────────────--

export interface TransactionFilters extends PeriodRange {
  categories?: number[]
}

export interface CreateTransactionPayload {
  description: string
  amount: number
  type: TransactionType
  categoryId?: number
  category?: string
  date?: string
  currency?: string
  creditCardId?: number | null
  isPaid?: boolean
}

export async function getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const { data } = await api.get('/finance/transactions', {
    params: {
      start: filters.start,
      end: filters.end,
      categories: filters.categories?.length ? filters.categories.join(',') : undefined,
    },
  })
  return data
}

export async function getTransaction(id: number): Promise<TransactionDetail> {
  const { data } = await api.get(`/finance/transactions/${id}`)
  return data
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const { data } = await api.post('/finance/transaction', payload)
  return data
}

// ── Installments ─────────────────────────────────────────────────────────--

export interface InstallmentScheduleEntry {
  amount: number
  dueDate: string
}

export interface CreateInstallmentPayload {
  description: string
  totalAmount: number
  count: number
  startDate: string
  categoryId?: number
  category?: string
  currency?: string
  creditCardId?: number | null
  // Optional per-installment amounts/due dates. When provided the backend uses
  // these instead of splitting `totalAmount` evenly across `count`.
  installments?: InstallmentScheduleEntry[]
}

export async function getInstallments(): Promise<InstallmentPlan[]> {
  const { data } = await api.get('/finance/installments')
  return data
}

export async function createInstallment(payload: CreateInstallmentPayload): Promise<Transaction> {
  const { data } = await api.post('/finance/installments', payload)
  return data
}

// ── Recurring ────────────────────────────────────────────────────────────--

export interface CreateRecurringPayload {
  description: string
  amount: number
  type: TransactionType
  frequency: RecurrenceFrequency
  startDate: string
  recurrenceEndDate?: string
  categoryId?: number
  category?: string
  currency?: string
}

export async function getRecurringPending(range: PeriodRange): Promise<RecurringPendingItem[]> {
  const { data } = await api.get('/finance/recurring/pending', { params: range })
  return data
}

export async function createRecurring(payload: CreateRecurringPayload): Promise<Transaction> {
  const { data } = await api.post('/finance/recurring', payload)
  return data
}

export async function createRecurringOccurrence(payload: {
  templateId: number
  amount: number
  dueDate: string
}): Promise<Transaction> {
  const { data } = await api.post('/finance/recurring/occurrence', payload)
  return data
}

// ── Spreadsheet ──────────────────────────────────────────────────────────--

export interface SpreadsheetFilters extends PeriodRange {
  types?: string[]
  categories?: number[]
  paid?: 'paid' | 'unpaid'
}

export interface UpdateSpreadsheetRowPayload {
  debitName: string
  dueDate: string
  amount: number
  isPaid: boolean
  currency: string
}

export async function getSpreadsheet(filters: SpreadsheetFilters): Promise<SpreadsheetRow[]> {
  const { data } = await api.get('/finance/spreadsheet', {
    params: {
      start: filters.start,
      end: filters.end,
      types: filters.types?.length ? filters.types.join(',') : undefined,
      categories: filters.categories?.length ? filters.categories.join(',') : undefined,
      paid: filters.paid,
    },
  })
  return data
}

export async function updateSpreadsheetRow(
  id: number,
  payload: UpdateSpreadsheetRowPayload,
): Promise<Transaction> {
  const { data } = await api.put(`/finance/spreadsheet/${id}`, payload)
  return data
}

export async function deleteSpreadsheetRow(id: number): Promise<void> {
  await api.delete(`/finance/spreadsheet/${id}`)
}

export async function bulkSetPaid(ids: number[], isPaid: boolean): Promise<void> {
  await api.post('/finance/spreadsheet/bulk-paid', { ids, isPaid })
}

export async function bulkDelete(ids: number[]): Promise<void> {
  await api.post('/finance/spreadsheet/bulk-delete', { ids })
}
