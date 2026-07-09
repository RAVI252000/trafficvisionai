/**
 * Mock user accounts for frontend-only authentication simulation.
 * Passwords are stored here for demo purposes only — replace with real API auth later.
 */
export const MOCK_USERS = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@trafficvision.ai',
    password: 'Admin@12345',
    role: 'ADMIN',
    avatar: null,
  },
  {
    id: 2,
    name: 'Traffic Operator',
    email: 'operator@trafficvision.ai',
    password: 'Operator@12345',
    role: 'TRAFFIC_OPERATOR',
    avatar: null,
  },
  {
    id: 3,
    name: 'Viewer User',
    email: 'viewer@trafficvision.ai',
    password: 'Viewer@12345',
    role: 'VIEWER',
    avatar: null,
  },
]

/** Demo account used by "Continue as Demo" */
export const DEMO_USER_EMAIL = 'operator@trafficvision.ai'
