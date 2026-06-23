import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as finance from '@/lib/api/finance'
import { extractApiError } from '@/lib/api/client'
import { queryKeys } from '@/lib/query-keys'

function useInvalidateFinance() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.all })
}

function toastError(error: unknown) {
  toast.error(extractApiError(error))
}

// ── Settings ─────────────────────────────────────────────────────────────--

export function useFinanceSettings() {
  return useQuery({ queryKey: queryKeys.finance.settings, queryFn: finance.getSettings })
}

export function useUpdateSettings() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (currency: string) => finance.updateSettings(currency),
    onSuccess: () => {
      toast.success('Moeda padrão atualizada.')
      invalidate()
    },
    onError: toastError,
  })
}

// ── Summary / transactions ─────────────────────────────────────────────────

export function useSummary(range: finance.PeriodRange) {
  return useQuery({
    queryKey: queryKeys.finance.summary(range),
    queryFn: () => finance.getSummary(range),
  })
}

export function useTransactions(filters: finance.TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.finance.transactions(filters as unknown as Record<string, unknown>),
    queryFn: () => finance.getTransactions(filters),
  })
}

export function useTransaction(id: number | null) {
  return useQuery({
    queryKey: queryKeys.finance.transaction(id ?? 0),
    queryFn: () => finance.getTransaction(id as number),
    enabled: id != null,
  })
}

export function useCreateTransaction() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createTransaction,
    onSuccess: () => {
      toast.success('Transação adicionada.')
      invalidate()
    },
    onError: toastError,
  })
}

// ── Categories ───────────────────────────────────────────────────────────--

export function useCategories() {
  return useQuery({ queryKey: queryKeys.finance.categories, queryFn: finance.getCategories })
}

export function useCreateCategory() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createCategory,
    onSuccess: () => {
      toast.success('Categoria criada.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: finance.CategoryPayload }) =>
      finance.updateCategory(id, payload),
    onSuccess: () => {
      toast.success('Categoria atualizada.')
      invalidate()
    },
    onError: toastError,
  })
}

// ── Credit cards ─────────────────────────────────────────────────────────--

export function useCreditCards() {
  return useQuery({ queryKey: queryKeys.finance.creditCards, queryFn: finance.getCreditCards })
}

export function useCreateCreditCard() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createCreditCard,
    onSuccess: () => {
      toast.success('Cartão criado.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useUpdateCreditCard() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: finance.CreditCardPayload }) =>
      finance.updateCreditCard(id, payload),
    onSuccess: () => {
      toast.success('Cartão atualizado.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useDeleteCreditCard() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.deleteCreditCard,
    onSuccess: () => {
      toast.success('Cartão removido.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useCreditCardSummary(id: number, year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.finance.creditCardSummary(id, year, month),
    queryFn: () => finance.getCreditCardSummary(id, year, month),
  })
}

export function useCreditCardTransactions(id: number, year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.finance.creditCardTransactions(id, year, month),
    queryFn: () => finance.getCreditCardTransactions(id, year, month),
  })
}

// ── Banks ────────────────────────────────────────────────────────────────--

export function useBanks() {
  return useQuery({ queryKey: queryKeys.finance.banks, queryFn: finance.getBanks })
}

export function useCreateBank() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createBank,
    onSuccess: () => {
      toast.success('Banco criado.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useUpdateBank() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: finance.BankPayload }) =>
      finance.updateBank(id, payload),
    onSuccess: () => {
      toast.success('Banco atualizado.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useDeleteBank() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.deleteBank,
    onSuccess: () => {
      toast.success('Banco removido.')
      invalidate()
    },
    onError: toastError,
  })
}

// ── Installments / recurring ───────────────────────────────────────────────

export function useInstallments() {
  return useQuery({ queryKey: queryKeys.finance.installments, queryFn: finance.getInstallments })
}

export function useCreateInstallment() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createInstallment,
    onSuccess: () => {
      toast.success('Parcelamento criado.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useRecurringPending(range: finance.PeriodRange) {
  return useQuery({
    queryKey: queryKeys.finance.recurringPending(range),
    queryFn: () => finance.getRecurringPending(range),
  })
}

export function useCreateRecurring() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createRecurring,
    onSuccess: () => {
      toast.success('Recorrência criada.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useCreateRecurringOccurrence() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.createRecurringOccurrence,
    onSuccess: () => {
      toast.success('Lançamento recorrente confirmado.')
      invalidate()
    },
    onError: toastError,
  })
}

// ── Spreadsheet ──────────────────────────────────────────────────────────--

export function useSpreadsheet(filters: finance.SpreadsheetFilters) {
  return useQuery({
    queryKey: queryKeys.finance.spreadsheet(filters as unknown as Record<string, unknown>),
    queryFn: () => finance.getSpreadsheet(filters),
  })
}

export function useUpdateSpreadsheetRow() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: finance.UpdateSpreadsheetRowPayload }) =>
      finance.updateSpreadsheetRow(id, payload),
    onSuccess: () => {
      toast.success('Linha atualizada.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useDeleteSpreadsheetRow() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: finance.deleteSpreadsheetRow,
    onSuccess: () => {
      toast.success('Transação removida.')
      invalidate()
    },
    onError: toastError,
  })
}

export function useBulkSetPaid() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ ids, isPaid }: { ids: number[]; isPaid: boolean }) =>
      finance.bulkSetPaid(ids, isPaid),
    onSuccess: () => invalidate(),
    onError: toastError,
  })
}

export function useBulkDelete() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (ids: number[]) => finance.bulkDelete(ids),
    onSuccess: () => {
      toast.success('Itens removidos.')
      invalidate()
    },
    onError: toastError,
  })
}
