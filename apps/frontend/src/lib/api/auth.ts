import { api } from './client'
import type { AuthResult, LoginPayload, RegisterPayload, User } from '@/types/auth'

function extractToken(headers: unknown): string {
  const record = (headers ?? {}) as Record<string, string>
  const raw = record.authorization ?? record.Authorization ?? ''
  return raw.replace(/^Bearer\s+/i, '')
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const response = await api.post('/auth/sign_in', { user: payload }, { skipAuthRedirect: true })
  return { user: response.data.user as User, token: extractToken(response.headers) }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const response = await api.post('/auth/sign_up', { user: payload }, { skipAuthRedirect: true })
  return { user: response.data.user as User, token: extractToken(response.headers) }
}

export async function logout(): Promise<void> {
  await api.delete('/auth/sign_out').catch(() => undefined)
}

export async function fetchMe(): Promise<User> {
  const response = await api.get('/user')
  return response.data.user as User
}
