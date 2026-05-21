import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  rememberMe: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
  setRememberMe: (remember: boolean) => void
}

/**
 * Determines storage backend based on rememberMe preference.
 * - localStorage: persists across browser sessions (remember me = true)
 * - sessionStorage: cleared when tab/browser closes (default)
 * Requirement 27.1
 */
function getStorageBackend(): Storage {
  try {
    const raw = localStorage.getItem('mediqueue-auth-remember')
    if (raw === 'true') return localStorage
  } catch {
    // fallback to sessionStorage
  }
  return sessionStorage
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      rememberMe: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        // Clear from both storages on logout
        try {
          localStorage.removeItem('mediqueue-auth')
          sessionStorage.removeItem('mediqueue-auth')
        } catch {
          // ignore storage errors
        }
      },
      updateUser: (user) => set({ user }),
      setRememberMe: (remember) => {
        // Persist the preference so getStorageBackend can read it on next load
        try {
          localStorage.setItem('mediqueue-auth-remember', String(remember))
        } catch {
          // ignore storage errors
        }
        set({ rememberMe: remember })
      },
    }),
    {
      name: 'mediqueue-auth',
      storage: createJSONStorage(() => getStorageBackend()),
    }
  )
)
