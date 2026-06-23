import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MONTH_LABELS } from "@/lib/format"

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

// Parse a `yyyy-mm-dd` string into local date parts (timezone-safe).
function parseInputValue(value?: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "")
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) }
}

interface CalendarProps {
  /** Selected date as `yyyy-mm-dd`. */
  value?: string
  /** Fired with the picked date as `yyyy-mm-dd`. */
  onSelect: (value: string) => void
}

export function Calendar({ value, onSelect }: CalendarProps) {
  const selected = parseInputValue(value)
  const today = new Date()

  const [view, setView] = React.useState(() => {
    const base = selected ?? { year: today.getFullYear(), month: today.getMonth() }
    return { year: base.year, month: base.month }
  })

  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  function shiftMonth(delta: number) {
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  function isSameDay(day: number): boolean {
    return Boolean(
      selected && selected.year === view.year && selected.month === view.month && selected.day === day,
    )
  }

  function isToday(day: number): boolean {
    return (
      today.getFullYear() === view.year &&
      today.getMonth() === view.month &&
      today.getDate() === day
    )
  }

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftMonth(-1)}>
          <ChevronLeftIcon />
          <span className="sr-only">Mês anterior</span>
        </Button>
        <span className="text-sm font-medium">
          {MONTH_LABELS[view.month]} {view.year}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftMonth(1)}>
          <ChevronRightIcon />
          <span className="sr-only">Próximo mês</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) =>
          day === null ? (
            <span key={`empty-${index}`} />
          ) : (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(`${view.year}-${pad2(view.month + 1)}-${pad2(day)}`)}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isToday(day) && !isSameDay(day) && "ring-1 ring-border",
                isSameDay(day) && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {day}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
