import { useEffect } from 'react'
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/auth-context'
import { AppShell } from '@/components/layout/app-shell'

export const Route = createFileRoute('/_authed')({
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

  // Bounce to login if the session drops while inside the app (e.g. token 401).
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', search: { redirect: undefined } })
    }
  }, [isAuthenticated, navigate])

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
