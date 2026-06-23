import { CreditCard, LayoutDashboard, Landmark, Table2 } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/spreadsheet', label: 'Planilha', icon: Table2 },
  { to: '/credit-cards', label: 'Cartões', icon: CreditCard },
  { to: '/banks', label: 'Bancos', icon: Landmark },
]
