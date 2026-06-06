import { authApi, type User } from './api'

const TOKEN_KEY = 'jetnexus_token'
const USER_KEY = 'jetnexus_user'

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function login(email: string, password: string): Promise<User> {
  const response = await authApi.login(email, password)
  saveToken(response.access_token)
  // login yanıtı user objesini de döndürüyor; ayrıca /me çağrısına gerek yok
  const user: User = response.user
  saveUser(user)
  return user
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.href = '/login'
}
