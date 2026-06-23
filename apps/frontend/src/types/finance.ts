export type TransactionType = 'Income' | 'Expense'

export type TransactionKind =
  | 'Standalone'
  | 'InstallmentRoot'
  | 'InstallmentPart'
  | 'RecurringRoot'
  | 'RecurringOccurrence'

export type RecurrenceFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'

export type SpreadsheetDebitType = 'Recorrente' | 'Parcela' | 'Cartão' | 'Receita' | 'Despesa'

export interface Transaction {
  id: number
  description: string
  amount: number
  type: TransactionType
  kind: TransactionKind
  date: string
  category: string
  categoryId: number
  categoryColorHex: string | null
  categoryIcon: string | null
  parentTransactionId: number | null
  installmentNumber: number | null
  totalInstallments: number | null
  recurrenceFrequency: RecurrenceFrequency | null
  isPaid: boolean
  currency: string
  creditCardId: number | null
  creditCardName: string | null
  creditCardColorHex: string | null
}

export interface TransactionDetail {
  transaction: Transaction
  installmentSiblings: Transaction[]
}

export interface FinanceSummary {
  totalIncome: number
  totalPurchases: number
  totalFixedCosts: number
  totalInstallments: number
  balance: number
  budgetProgress: number
  startDate: string
  endDate: string
}

export interface Category {
  id: number
  name: string
  colorHex: string | null
  icon: string | null
}

export interface CreditCard {
  id: number
  name: string
  colorHex: string | null
  bankName: string | null
  networkBrand: string | null
  lastFourDigits: string | null
  notes: string | null
  createdAtUtc: string
}

export interface BankAccount {
  id: number
  name: string
  colorHex: string | null
  institutionName: string | null
  defaultCurrency: string
  notes: string | null
  createdAtUtc: string
}

export interface FinanceSettings {
  defaultCurrency: string
  source: 'user' | 'region'
}

export interface InstallmentPlan {
  id: number
  description: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  remainingInstallments: number
  startDate: string
  nextPaymentDate: string
}

export interface RecurringPendingItem {
  templateId: number
  description: string
  category: string
  suggestedAmount: number
  suggestedDueDay: number
  type: TransactionType
  frequency: RecurrenceFrequency
}

export interface SpreadsheetRow {
  id: number
  debitType: SpreadsheetDebitType
  debitName: string
  dueDate: string
  amount: number
  isPaid: boolean
  isOverdue: boolean
  currency: string
  categoryLabel: string
  categoryColorHex: string | null
  creditCardLabel: string | null
  creditCardColorHex: string | null
}

export interface CreditCardInvoiceSummary {
  creditCardId: number
  creditCardName: string
  periodStart: string
  periodEnd: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  isPaid: boolean
}

export const COMMON_CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS', 'MXN', 'CAD', 'AUD']
