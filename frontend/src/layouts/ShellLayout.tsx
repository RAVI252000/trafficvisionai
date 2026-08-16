import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '../components/layout/Sidebar'
import { Navbar } from '../components/layout/Navbar'

/**
 * Shell Layout containing Sidebar (with mobile drawer mode) and Navbar.
 * Animates page content transitions.
 */
export function ShellLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-tv-bg text-tv-text">
      {/* Grid background overlay for enterprise UI feel */}
      <div className="tv-grid-bg absolute inset-0 pointer-events-none opacity-40" />

      <Navbar onMenuOpen={() => setSidebarOpen(true)} />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Content panel */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-auto max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Sidebar - Mobile/Tablet drawer (slides in from left) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            {/* Sidebar drawer container */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 h-full w-64 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
export default ShellLayout
