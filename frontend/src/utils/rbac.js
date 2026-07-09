import { ROLES, ROUTES } from './constants'

/**
 * Page-level access rules.
 * ADMIN → all pages
 * TRAFFIC_OPERATOR → all except Admin
 * VIEWER → read-only subset (optional)
 */
const PAGE_PERMISSIONS = {
  [ROUTES.DASHBOARD]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.TRAFFIC_MONITORING]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.TRAFFIC_PREDICTION]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.ROUTE_ANALYSIS]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.ALERTS]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.ANALYTICS]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.PROFILE]: [ROLES.ADMIN, ROLES.TRAFFIC_OPERATOR, ROLES.VIEWER],
  [ROUTES.ADMIN]: [ROLES.ADMIN],
}

/** Returns true if the given role may access a route */
export function canAccessPage(role, path) {
  const allowed = PAGE_PERMISSIONS[path]
  if (!allowed) return true
  return allowed.includes(role)
}

/** Returns true if role has write/edit permissions */
export function canWrite(role) {
  return role === ROLES.ADMIN || role === ROLES.TRAFFIC_OPERATOR
}

/** Returns true if role is admin */
export function isAdmin(role) {
  return role === ROLES.ADMIN
}
