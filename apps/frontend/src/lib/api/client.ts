import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_V1_URL } from '@/lib/env'
import { clearToken, getToken } from '@/lib/token-storage'

// Event emitted when the API rejects the current token (401). The AuthProvider
// listens for it to drop the session and bounce to the login screen.
export const UNAUTHORIZED_EVENT = 'finance:unauthorized'

// Per-request flag: set on auth endpoints so a failed login doesn't trigger a
// global "session expired" redirect.
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

export const api = axios.create({
  baseURL: API_V1_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const skip = error.config?.skipAuthRedirect

    if (status === 401 && !skip) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

// Normalizes the Rails error payload (`{ errors: [...] }` or Devise strings)
// into a single human-readable message.
export function extractApiError(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: unknown; error?: string; message?: string }
      | undefined
    const errors = data?.errors

    if (Array.isArray(errors) && errors.length > 0) {
      return errors
        .map((entry) => {
          if (typeof entry === 'string') return entry
          if (entry && typeof entry === 'object') {
            const obj = entry as Record<string, unknown>
            if (typeof obj.message === 'string') return obj.message
            return Object.entries(obj)
              .map(([field, messages]) =>
                Array.isArray(messages) ? `${field} ${messages.join(', ')}` : `${field} ${messages}`,
              )
              .join('. ')
          }
          return String(entry)
        })
        .join('. ')
    }
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.message === 'string') return data.message
  }
  return fallback
}
