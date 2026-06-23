export interface User {
  id: number
  email: string
  name: string
  username: string
  first_name: string
  last_name: string
  created_at?: string
  updated_at?: string
}

export interface AuthResult {
  user: User
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  password_confirmation: string
  username?: string
  first_name?: string
  last_name?: string
}
