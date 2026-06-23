export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  finance: {
    all: ['finance'] as const,
    settings: ['finance', 'settings'] as const,
    summary: (range: { start: string; end: string }) =>
      ['finance', 'summary', range] as const,
    transactions: (params: Record<string, unknown>) =>
      ['finance', 'transactions', params] as const,
    transaction: (id: number) => ['finance', 'transaction', id] as const,
    categories: ['finance', 'categories'] as const,
    creditCards: ['finance', 'credit-cards'] as const,
    creditCardSummary: (id: number, year: number, month: number) =>
      ['finance', 'credit-card-summary', id, year, month] as const,
    creditCardTransactions: (id: number, year: number, month: number) =>
      ['finance', 'credit-card-transactions', id, year, month] as const,
    banks: ['finance', 'banks'] as const,
    spreadsheet: (params: Record<string, unknown>) =>
      ['finance', 'spreadsheet', params] as const,
    installments: ['finance', 'installments'] as const,
    recurringPending: (range: { start: string; end: string }) =>
      ['finance', 'recurring', 'pending', range] as const,
  },
}
