import { useEffect, useState } from 'react'
import { Loader2, Settings } from 'lucide-react'
import { useFinanceSettings, useUpdateSettings } from '@/hooks/use-finance'
import { COMMON_CURRENCIES } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const settings = useFinanceSettings()
  const updateSettings = useUpdateSettings()
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    if (settings.data?.defaultCurrency) {
      setCurrency(settings.data.defaultCurrency)
    }
  }, [settings.data?.defaultCurrency])

  async function handleSave() {
    await updateSettings.mutateAsync(currency)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Configurações">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>Defina a moeda padrão das novas transações.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Moeda padrão</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
