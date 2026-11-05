export type MonthSearch = {
  year?: number
  month?: number
}

export type ResolvedMonth = {
  year: number
  month: number
}

export function resolveMonthSearch(search: MonthSearch): ResolvedMonth {
  const now = new Date()
  const year = Number(search.year)
  const month = Number(search.month)
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear(),
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1,
  }
}

export function validateMonthSearch(search: Record<string, unknown>): MonthSearch {
  const year = Number(search.year)
  const month = Number(search.month)
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : undefined,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
  }
}
