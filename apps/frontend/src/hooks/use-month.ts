import { useCallback, useMemo, useState } from 'react'
import { MONTH_LABELS, monthRange } from '@/lib/format'

export function useMonth() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const range = useMemo(() => monthRange(year, month), [year, month])
  const label = `${MONTH_LABELS[month - 1]} ${year}`

  const next = useCallback(() => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1)
        return 1
      }
      return m + 1
    })
  }, [])

  const prev = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1)
        return 12
      }
      return m - 1
    })
  }, [])

  return { year, month, range, label, next, prev, setYear, setMonth }
}
