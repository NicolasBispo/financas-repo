import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { usePaymentMethods } from '@/hooks/use-finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  onCommit: (value: string) => void
  disabled?: boolean
  className?: string
}

export function PaymentMethodSelect({ value, onChange, onCommit, disabled, className }: Props) {
  const paymentMethods = usePaymentMethods()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const options = useMemo(() => {
    const fromApi = paymentMethods.data ?? []
    const merged = new Set(fromApi)
    if (value.trim()) merged.add(value.trim())
    return [...merged].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [paymentMethods.data, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((item) => item.toLowerCase().includes(q))
  }, [options, query])

  const canCreate = useMemo(() => {
    const q = query.trim()
    if (!q) return false
    return !options.some((item) => item.toLowerCase() === q.toLowerCase())
  }, [options, query])

  function select(next: string) {
    const normalized = next.trim().toUpperCase()
    onChange(normalized)
    onCommit(normalized)
    setOpen(false)
    setQuery('')
  }

  function clear() {
    onChange('')
    onCommit('')
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          className={cn(
            'h-8 w-full justify-between border-transparent bg-transparent px-1 font-normal shadow-none hover:bg-transparent focus-visible:border-input focus-visible:bg-background',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{value || '—'}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          autoFocus
          value={query}
          placeholder="Buscar ou adicionar..."
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) {
              e.preventDefault()
              select(query.trim())
            }
          }}
          className="mb-2 h-8"
        />
        <div className="max-h-56 space-y-0.5 overflow-y-auto">
          {value ? (
            <button
              type="button"
              className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
              onClick={clear}
            >
              Limpar
            </button>
          ) : null}
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => select(item)}
            >
              <Check className={cn('size-3.5 shrink-0', value === item ? 'opacity-100' : 'opacity-0')} />
              <span className="truncate">{item}</span>
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => select(query.trim())}
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">Adicionar “{query.trim()}”</span>
            </button>
          ) : null}
          {filtered.length === 0 && !canCreate ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum método encontrado.</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
