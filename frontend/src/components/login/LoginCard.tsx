import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Activity, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, type InputState } from '../ui/Input'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'

interface FieldValidation {
  email: InputState
  password: InputState
  emailMessage?: string
  passwordMessage?: string
}

const initialValidation: FieldValidation = {
  email: 'default',
  password: 'default',
}

/** Simple client-side validation for demo UX — no backend calls */
function validateForm(email: string, password: string): FieldValidation {
  const result: FieldValidation = { email: 'default', password: 'default' }

  if (!email.trim()) {
    result.email = 'error'
    result.emailMessage = 'Email address is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    result.email = 'error'
    result.emailMessage = 'Please enter a valid email address'
  } else {
    result.email = 'success'
  }

  if (!password) {
    result.password = 'error'
    result.passwordMessage = 'Password is required'
  } else if (password.length < 8) {
    result.password = 'error'
    result.passwordMessage = 'Password must be at least 8 characters'
  } else {
    result.password = 'success'
  }

  return result
}

/**
 * Glassmorphism login card with form fields, validation states,
 * and demo mode — frontend only, no authentication backend.
 */
export function LoginCard() {
  const { login, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [validation, setValidation] = useState<FieldValidation>(initialValidation)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError(null)

    const result = validateForm(email, password)
    setValidation(result)

    if (result.email === 'error' || result.password === 'error') return

    setIsLoading(true)
    try {
      await login(email, password, rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemo = async () => {
    setIsDemoLoading(true)
    setError(null)
    try {
      await loginAsDemo()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Demo login failed')
    } finally {
      setIsDemoLoading(false)
    }
  }

  const getEmailState = (): InputState => {
    if (!submitted && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'success'
    return submitted ? validation.email : 'default'
  }

  const getPasswordState = (): InputState => {
    if (!submitted && password.length >= 8) return 'success'
    return submitted ? validation.password : 'default'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="tv-glass w-full max-w-[420px] rounded-3xl p-8 sm:p-10"
    >
      {/* Logo & header */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-tv-primary to-blue-400 shadow-lg shadow-blue-500/25"
        >
          <Activity className="h-6 w-6 text-white" aria-hidden="true" />
        </motion.div>

        <h1 className="text-2xl font-bold tracking-tight text-tv-text">
          TrafficVision AI
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-tv-muted">
          AI-Powered Smart Traffic Prediction &amp; Congestion Management
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          state={getEmailState()}
          helperText={
            submitted && validation.emailMessage ? validation.emailMessage : undefined
          }
          leadingIcon={<Mail className="h-[18px] w-[18px]" />}
        />

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          state={getPasswordState()}
          helperText={
            submitted && validation.passwordMessage
              ? validation.passwordMessage
              : undefined
          }
          leadingIcon={<Lock className="h-[18px] w-[18px]" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="tv-focus-ring rounded-md p-1 text-tv-muted transition-colors hover:text-tv-text"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          }
        />

        {/* Remember me & forgot password */}
        <div className="flex items-center justify-between pt-1">
          <Checkbox
            label="Remember Me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <a
            href="#"
            className="tv-focus-ring rounded-md text-sm font-medium text-tv-primary transition-colors hover:text-blue-400"
            onClick={(e) => e.preventDefault()}
          >
            Forgot Password?
          </a>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" variant="primary" loading={isLoading}>
            Sign In
          </Button>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="px-4 text-xs font-medium uppercase tracking-wider text-tv-muted">
              or
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <Button
            type="button"
            variant="secondary"
            loading={isDemoLoading}
            loadingText="Loading demo…"
            icon={<PlayCircle className="h-4 w-4" aria-hidden="true" />}
            onClick={handleDemo}
          >
            Continue as Demo
          </Button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/[0.06] pt-6 text-center">
        <p className="text-xs text-tv-muted">Version 1.0.0</p>
        <p className="mt-1 text-xs text-tv-muted/70">
          &copy; 2026 TrafficVision AI
        </p>
      </footer>
    </motion.div>
  )
}
