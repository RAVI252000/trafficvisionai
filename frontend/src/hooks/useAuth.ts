import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '../context/AuthContext'

/** Convenience hook for consuming auth state */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
