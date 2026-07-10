import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Shield, ChevronDown, User, LogOut, Clock, HelpCircle, Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

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
  
  const [time, setTime] = useState(new Date())
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close menus when clicking outside (simple cleanup)
  useEffect(() => {
    const handleOutsideClick = () => {
      setNotificationsOpen(false)
      setProfileOpen(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Dynamic breadcrumb text mapping
  const getBreadcrumbName = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview'
      case '/traffic-monitoring':
        return 'Real-Time Traffic Monitoring'
      case '/traffic-prediction':
        return 'Congestion & Flow Prediction'
      case '/route-analysis':
        return 'Route Optimization & Analysis'
      case '/alerts':
        return 'Incidents & Critical Alerts'
      case '/analytics':
        return 'Historical Data Analytics'
      case '/profile':
        return 'Operator Profile'
      case '/admin':
        return 'System Administration'
      default:
        return 'System Hub'
    }
  }

  // Mock Notification List
  const mockNotifications = [
    { id: 1, message: 'Congestion detected on Route 4 (Severe)', type: 'danger', time: '2m ago' },
    { id: 2, message: 'Sensor intersection 12 re-calibrated', type: 'info', time: '15m ago' },
    { id: 3, message: 'Rain warning updated for downtown area', type: 'warning', time: '1h ago' },
  ]

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDay = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.06] bg-[#0F172A]/70 px-6 backdrop-blur-xl">
      {/* Breadcrumbs / Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuOpen()
          }}
          className="rounded-xl p-2 text-tv-muted hover:bg-white/[0.04] hover:text-tv-text lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden items-center gap-2 text-xs font-semibold text-tv-muted sm:flex">
          <span className="text-tv-primary flex items-center gap-1.5 font-bold">
            <Activity className="h-3.5 w-3.5" /> TrafficVision AI
          </span>
          <span className="text-white/20">/</span>
          <span className="text-tv-text font-medium">{getBreadcrumbName(location.pathname)}</span>
        </div>
      </div>

      {/* Right Navbar Section */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock widget */}
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-3.5 py-1.5 text-xs font-medium text-tv-muted md:flex">
          <Clock className="h-3.5 w-3.5 text-tv-primary" />
          <span className="font-mono text-tv-text">{formatTime(time)}</span>
          <span className="text-white/10">|</span>
          <span>{formatDay(time)}</span>
        </div>

        {/* Notification bell dropdown trigger */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setNotificationsOpen(!notificationsOpen)
              setProfileOpen(false)
            }}
            className={`
              relative rounded-xl border border-white/[0.06] p-2.5 text-tv-muted transition-colors hover:bg-white/[0.04] hover:text-tv-text
              ${notificationsOpen ? 'bg-white/[0.04] text-tv-text' : 'bg-transparent'}
            `}
            aria-label="View notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0F172A]" />
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#1E293B] p-2 shadow-2xl shadow-black/60 focus:outline-none"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tv-text">Live System Alerts</h3>
                  <span className="rounded-full bg-tv-primary/10 px-2 py-0.5 text-[10px] font-bold text-tv-primary">
                    3 New
                  </span>
                </div>
                <div className="mt-1 divide-y divide-white/[0.04]">
                  {mockNotifications.map((notif) => (
                    <div key={notif.id} className="flex flex-col gap-1 px-4 py-3 hover:bg-white/[0.02] transition-colors rounded-lg cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className={`h-1.5 w-1.5 rounded-full ${notif.type === 'danger' ? 'bg-red-500' : notif.type === 'warning' ? 'bg-tv-orange' : 'bg-blue-400'}`} />
                        <span className="text-[10px] text-tv-muted">{notif.time}</span>
                      </div>
                      <p className="text-xs font-medium text-tv-text line-clamp-2 leading-relaxed">{notif.message}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-1 border-t border-white/[0.06] p-2 text-center">
                  <button className="text-xs font-semibold text-tv-primary transition-colors hover:text-blue-400 w-full py-1">
                    View All Incidents
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile dropdown trigger */}
        {user && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setProfileOpen(!profileOpen)
                setNotificationsOpen(false)
              }}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-transparent p-1.5 pr-3 text-tv-muted transition-colors hover:bg-white/[0.04] hover:text-tv-text"
              aria-label="User menu"
            >
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-tv-primary/20 text-xs font-bold text-tv-primary border border-tv-primary/20 uppercase">
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
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#1E293B] p-2 shadow-2xl shadow-black/60 focus:outline-none"
                >
                  <div className="border-b border-white/[0.06] px-3.5 py-3">
                    <span className="block text-xs font-bold text-tv-text">{user.name}</span>
                    <span className="block truncate text-[10px] text-tv-muted">{user.email}</span>
                    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-tv-primary/10 px-2 py-0.5 text-[9px] font-bold text-tv-primary w-fit">
                      <Shield className="h-3 w-3" />
                      <span>{user.role}</span>
                    </div>
                  </div>
                  
                  <div className="mt-1 space-y-0.5">
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-tv-muted transition-colors hover:bg-white/[0.02] hover:text-tv-text">
                      <User className="h-4 w-4 text-tv-primary" />
                      My Profile
                    </button>
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-tv-muted transition-colors hover:bg-white/[0.02] hover:text-tv-text">
                      <HelpCircle className="h-4 w-4 text-tv-primary" />
                      Help &amp; Docs
                    </button>
                    
                    <div className="h-px bg-white/[0.06] my-1" />
                    
                    <button
                      onClick={() => logout()}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
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
