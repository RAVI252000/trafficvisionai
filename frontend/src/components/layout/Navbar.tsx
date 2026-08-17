import { useState, useEffect } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Shield, ChevronDown, User, LogOut, Clock, HelpCircle, Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'
import { alertService } from '../../services/alertService'
import { isAdmin } from '../../utils/rbac'

interface NavbarProps {
  onMenuOpen: () => void
}

/**
 * Top Navigation bar with glassmorphism layout, dynamic breadcrumbs, live clock,
 * notification dropdown, and profile details menu.
 */
export function Navbar({ onMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [time, setTime] = useState(new Date())
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeAlerts, setActiveAlerts] = useState<any[]>([])

  const navItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD },
    { name: 'Monitoring', path: ROUTES.TRAFFIC_MONITORING },
    { name: 'Prediction', path: ROUTES.TRAFFIC_PREDICTION },
    { name: 'Routes', path: ROUTES.ROUTE_ANALYSIS },
    { name: 'Alerts', path: ROUTES.ALERTS },
    { name: 'Analytics', path: ROUTES.ANALYTICS },
    { name: 'Heatmap', path: ROUTES.HEATMAP },
    { name: 'Trends', path: ROUTES.TRENDS },
    { name: 'Advisory', path: ROUTES.RECOMMENDATIONS },
    { name: 'Reports', path: ROUTES.REPORTS },
  ]

  if (user && isAdmin(user.role)) {
    navItems.push({ name: 'Admin', path: ROUTES.ADMIN })
  }

  const fetchActiveAlerts = async () => {
    try {
      const data = await alertService.getAlerts({ status: 'Active' })
      setActiveAlerts(data)
    } catch (err) {
      console.error('Failed to fetch active alerts for navbar', err)
    }
  }

  useEffect(() => {
    fetchActiveAlerts()
    const interval = setInterval(fetchActiveAlerts, 15000)
    return () => clearInterval(interval)
  }, [])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setProfileOpen(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDay = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-tv-border bg-tv-surface/80 px-6 backdrop-blur-xl shadow-xs">
      {/* Brand & Desktop Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuOpen()
          }}
          className="rounded-xl p-2 text-tv-muted hover:bg-black/[0.04] hover:text-tv-text lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 text-sm font-semibold text-tv-muted cursor-pointer" onClick={() => navigate(ROUTES.DASHBOARD)}>
          <span className="text-tv-primary flex items-center gap-1.5 font-bold text-base">
            <Activity className="h-5 w-5 animate-pulse" /> TrafficVision AI
          </span>
        </div>

        {/* Horizontal Navigation Menu for Desktop */}
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200
                  ${
                    isActive
                      ? 'text-white bg-tv-primary shadow-sm shadow-tv-primary/10'
                      : 'text-tv-muted hover:text-tv-text hover:bg-black/[0.03]'
                  }
                `}
              >
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Right Navbar Section */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock widget */}
        <div className="hidden items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-3.5 py-1.5 text-xs font-medium text-tv-muted md:flex">
          <Clock className="h-3.5 w-3.5 text-tv-primary" />
          <span className="font-mono text-tv-text">{formatTime(time)}</span>
          <span className="text-tv-border">|</span>
          <span>{formatDay(time)}</span>
        </div>

        {/* Notification bell trigger */}
        <div className="relative">
          <button
            onClick={() => navigate(ROUTES.ALERTS)}
            className="relative rounded-xl border border-tv-border p-2.5 text-tv-muted transition-colors hover:bg-black/[0.03] hover:text-tv-text cursor-pointer"
            aria-label="View alerts"
          >
            <Bell className="h-4.5 w-4.5" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {activeAlerts.length}
              </span>
            )}
          </button>
        </div>

        {/* User Profile dropdown trigger */}
        {user && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setProfileOpen(!profileOpen)
              }}
              className="flex items-center gap-2 rounded-xl border border-tv-border bg-transparent p-1.5 pr-3 text-tv-muted transition-colors hover:bg-black/[0.03] hover:text-tv-text"
              aria-label="User menu"
            >
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-tv-primary/10 text-xs font-bold text-tv-primary border border-tv-primary/20 uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="hidden text-left sm:block">
                <span className="block text-xs font-semibold text-tv-text leading-none">{user.name}</span>
                <span className="mt-0.5 block text-[9px] text-tv-muted leading-none font-medium">{user.role}</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-tv-border bg-tv-surface p-2 shadow-xl focus:outline-none"
                >
                  <div className="border-b border-tv-border px-3.5 py-3">
                    <span className="block text-xs font-bold text-tv-text">{user.name}</span>
                    <span className="block truncate text-[10px] text-tv-muted">{user.email}</span>
                    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-tv-primary/10 px-2 py-0.5 text-[9px] font-bold text-tv-primary w-fit">
                      <Shield className="h-3 w-3" />
                      <span>{user.role}</span>
                    </div>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        navigate(ROUTES.PROFILE)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-tv-muted transition-colors hover:bg-black/[0.02] hover:text-tv-text"
                    >
                      <User className="h-4 w-4 text-tv-primary" />
                      My Profile
                    </button>
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-tv-muted transition-colors hover:bg-black/[0.02] hover:text-tv-text">
                      <HelpCircle className="h-4 w-4 text-tv-primary" />
                      Help &amp; Docs
                    </button>
                    
                    <div className="h-px bg-tv-border my-1" />
                    
                    <button
                      onClick={() => logout()}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-550 transition-colors hover:bg-red-50 hover:text-red-650"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  )
}
export default Navbar
