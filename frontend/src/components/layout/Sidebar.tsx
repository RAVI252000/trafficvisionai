import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Eye,
  TrendingUp,
  Navigation,
  AlertTriangle,
  BarChart3,
  User,
  ShieldCheck,
  LogOut,
  X,
  Activity
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'
import { isAdmin } from '../../utils/rbac'

interface SidebarProps {
  onClose?: () => void
}

/**
 * Premium dark vertical sidebar with responsive toggles, dynamic RBAC routes,
 * and elegant framer-motion indicator transitions.
 */
export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Traffic Monitoring', path: ROUTES.TRAFFIC_MONITORING, icon: Eye },
    { name: 'Traffic Prediction', path: ROUTES.TRAFFIC_PREDICTION, icon: TrendingUp },
    { name: 'Route Analysis', path: ROUTES.ROUTE_ANALYSIS, icon: Navigation },
    { name: 'Alerts & Incidents', path: ROUTES.ALERTS, icon: AlertTriangle },
    { name: 'Analytics', path: ROUTES.ANALYTICS, icon: BarChart3 },
    { name: 'User Profile', path: ROUTES.PROFILE, icon: User },
  ]

  // Conditionally render Admin route
  if (user && isAdmin(user.role)) {
    navItems.push({ name: 'Admin Settings', path: ROUTES.ADMIN, icon: ShieldCheck })
  }

  const handleLogout = async () => {
    if (onClose) onClose()
    await logout()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-[#0F172A] px-5 py-6">
      {/* Sidebar Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-tv-primary to-blue-400 shadow-md shadow-blue-500/20">
            <Activity className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="block font-bold tracking-wide text-tv-text">TrafficVision</span>
            <span className="text-[10px] uppercase tracking-wider text-tv-primary font-semibold">Smart Platform</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-tv-muted hover:bg-white/[0.04] hover:text-tv-text lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium
                transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary/50
                ${
                  isActive
                    ? 'text-white'
                    : 'text-tv-muted hover:bg-white/[0.03] hover:text-tv-text'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBackground"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-tv-primary/20 to-blue-500/[0.04] border-l-2 border-tv-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`relative z-10 h-5 w-5 ${isActive ? 'text-tv-primary' : ''}`} />
              <span className="relative z-10">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-white/[0.06] pt-4">
        {user && (
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tv-primary/20 text-sm font-semibold text-tv-primary border border-tv-primary/30 uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <span className="block truncate text-xs font-semibold text-tv-text">{user.name}</span>
              <span className="block truncate text-[10px] text-tv-muted">{user.role}</span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
export default Sidebar
