import { useCallback, useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { MONTH_LABELS, monthRange } from '@/lib/format'
import { resolveMonthSearch, type MonthSearch } from '@/lib/month-search'

export function useMonth(search: MonthSearch) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { year, month } = resolveMonthSearch(search)

  const range = useMemo(() => monthRange(year, month), [year, month])
  const label = `${MONTH_LABELS[month - 1]} ${year}`

  const setMonthYear = useCallback(
    (nextYear: number, nextMonth: number) => {
      void navigate({
        to: pathname,
        search: (prev) => ({ ...prev, year: nextYear, month: nextMonth }),
        replace: true,
      })
    },
    [navigate, pathname],
  )

  const next = useCallback(() => {
    if (month === 12) setMonthYear(year + 1, 1)
    else setMonthYear(year, month + 1)
  }, [month, setMonthYear, year])

  const prev = useCallback(() => {
    if (month === 1) setMonthYear(year - 1, 12)
    else setMonthYear(year, month - 1)
  }, [month, setMonthYear, year])

  return {
    year,
    month,
    range,
    label,
    next,
    prev,
    setYear: (y: number) => setMonthYear(y, month),
    setMonth: (m: number) => setMonthYear(year, m),
  }
}
