import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Wallet } from 'lucide-react'
import { navItems } from './nav-config'
import { AppSidebar } from './app-sidebar'
import { UserMenu } from './user-menu'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between gap-2 border-b border-border px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </div>
            <span className="text-sm font-semibold">Finanças</span>
          </div>
          <div className="w-40">
            <UserMenu />
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: 'bg-muted text-foreground' }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
