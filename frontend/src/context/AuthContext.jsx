import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

/**
 * Provides simulated authentication state across the app.
 * Session is persisted via authService (localStorage / sessionStorage).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = authService.getStoredSession()
    if (stored) setUser(stored)
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password, remember = false) => {
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
