import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from '@/lib/api/auth'
import { UNAUTHORIZED_EVENT } from '@/lib/api/client'
import { queryKeys } from '@/lib/query-keys'
import { clearToken, getToken, setToken } from '@/lib/token-storage'
import type { LoginPayload, RegisterPayload, User } from '@/types/auth'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(() => getToken())

  // A global 401 (token expired or revoked) drops the session.
  useEffect(() => {
    const handler = () => setTokenState(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handler)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
  }, [])

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchMe,
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginApi(payload)
      setToken(result.token)
      setTokenState(result.token)
      queryClient.setQueryData(queryKeys.auth.me, result.user)
    },
    [queryClient],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await registerApi(payload)
      setToken(result.token)
      setTokenState(result.token)
      queryClient.setQueryData(queryKeys.auth.me, result.user)
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    await logoutApi()
    clearToken()
    setTokenState(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: (meQuery.data as User | undefined) ?? null,
      token,
      isAuthenticated: !!token,
      isLoading: !!token && meQuery.isLoading,
      login,
      register,
      logout,
    }),
    [token, meQuery.data, meQuery.isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
