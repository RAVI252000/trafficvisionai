import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPage } from '../../utils/rbac'
import { ROUTES } from '../../utils/constants'

/**
 * Route guard — redirects unauthenticated users to login.
 * Optionally restricts access by role using RBAC rules.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-tv-bg">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-tv-primary border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  if (!canAccessPage(user.role, location.pathname)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}
