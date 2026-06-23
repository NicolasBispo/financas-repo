import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthSelectorProps {
  label: string
  onPrev: () => void
  onNext: () => void
}

export function MonthSelector({ label, onPrev, onNext }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Button variant="ghost" size="icon-sm" onClick={onPrev} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium capitalize">{label}</span>
      <Button variant="ghost" size="icon-sm" onClick={onNext} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
