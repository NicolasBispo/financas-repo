import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { dateInputToBR } from "@/lib/format"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateFieldProps {
  /** Date value as `yyyy-mm-dd` (same contract as a native `<input type="date">`). */
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  placeholder?: string
}

// A date picker that always renders dates as dd/mm/yyyy, regardless of the
// browser locale (which is what drives the native `<input type="date">`).
export function DateField({
  value,
  onChange,
  id,
  className,
  placeholder = "dd/mm/aaaa",
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false)
  const display = dateInputToBR(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
            className,
          )}
        >
          <span className={cn(!display && "text-muted-foreground")}>{display || placeholder}</span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <Calendar
          value={value}
          onSelect={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
