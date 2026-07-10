import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services/authService'

export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar: string | null
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<User>
  loginAsDemo: () => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provides simulated authentication state across the app.
 * Session is persisted via authService (localStorage / sessionStorage).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const stored = authService.getStoredSession()
    if (stored) setUser(stored)
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    const session = await authService.login(email, password)
    authService.saveSession(session, remember)
    setUser(session)
    return session
  }, [])

  const loginAsDemo = useCallback(async () => {
    const session = await authService.loginAsDemo()
    authService.saveSession(session, true)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      loginAsDemo,
      logout,
    }),
    [user, loading, login, loginAsDemo, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
