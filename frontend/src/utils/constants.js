/** Application-wide constants */
export const APP_NAME = 'TrafficVision AI'
export const APP_VERSION = '1.0.0'
export const STORAGE_KEY = 'tv_auth_session'

/** Supported user roles */
export const ROLES = {
  ADMIN: 'ADMIN',
  TRAFFIC_OPERATOR: 'TRAFFIC_OPERATOR',
  VIEWER: 'VIEWER',
}

/** Route paths — centralised for sidebar and guards */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TRAFFIC_MONITORING: '/traffic-monitoring',
  TRAFFIC_PREDICTION: '/traffic-prediction',
  ROUTE_ANALYSIS: '/route-analysis',
  ALERTS: '/alerts',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  ADMIN: '/admin',
}
