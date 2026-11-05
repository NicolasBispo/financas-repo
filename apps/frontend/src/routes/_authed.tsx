import { useEffect } from 'react'
import {
  Outlet,
  createFileRoute,
  redirect,
  retainSearchParams,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useAuth } from '@/context/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { resolveMonthSearch, validateMonthSearch } from '@/lib/month-search'

export const Route = createFileRoute('/_authed')({
  validateSearch: validateMonthSearch,
  search: {
    middlewares: [retainSearchParams(['year', 'month'])],
  },
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = Route.useSearch()
  const { year, month } = resolveMonthSearch(search)

  // Bounce to login if the session drops while inside the app (e.g. token 401).
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', search: { redirect: undefined } })
    }
  }, [isAuthenticated, navigate])

  // Persist resolved month into the URL so Links between pages keep it —
  // always on the current pathname (never bounce to dashboard).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('year') === String(year) && params.get('month') === String(month)) return
    void navigate({
      to: pathname,
      search: (prev) => ({ ...prev, year, month }),
      replace: true,
    })
  }, [year, month, navigate, pathname])

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
