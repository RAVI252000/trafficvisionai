import { motion } from 'framer-motion'
import { AnimatedBackground } from '../components/login/AnimatedBackground'
import { SmartCityIllustration } from '../components/login/SmartCityIllustration'
import { LoginCard } from '../components/login/LoginCard'

/**
 * Split-screen login page for TrafficVision AI.
 * Desktop: 60% illustration / 40% login card.
 * Mobile: illustration hidden, centered card.
 */
export function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative flex min-h-svh w-full"
    >
      <AnimatedBackground />

      {/* Left panel — smart city illustration (hidden on mobile) */}
      <div className="relative hidden w-[60%] overflow-hidden lg:block">
        <div className="absolute inset-y-0 right-0 w-px bg-white/[0.06]" />
        <SmartCityIllustration />
      </div>

      {/* Right panel — login card */}
      <div className="relative flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[40%]">
        <LoginCard />
      </div>
    </motion.div>
  )
}
