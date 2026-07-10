import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPage } from '../../utils/rbac'
import { Loader2 } from 'lucide-react'

/**
 * Route protector that checks authentication state and RBAC permissions.
 * Redirects unauthenticated users to `/login` and unauthorized users to `/dashboard`.
 */
export function AuthGuard() {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-tv-bg text-tv-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-tv-primary" />
          <span className="text-sm font-medium text-tv-muted">Verifying session…</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const hasAccess = canAccessPage(user.role, location.pathname)

  if (!hasAccess) {
    // If user doesn't have access to this route, redirect to Dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
