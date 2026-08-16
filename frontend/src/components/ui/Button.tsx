import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
  fullWidth?: boolean
}

/**
 * Primary and glass secondary buttons with hover/press/loading states.
 */
export function Button({
  variant = 'primary',
  loading = false,
  loadingText = 'Signing in…',
  icon,
  fullWidth = true,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const baseClasses =
    'tv-focus-ring relative inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50'

  const variantClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-tv-primary to-amber-500 text-white shadow-lg shadow-tv-primary/20 hover:shadow-tv-primary/35 hover:from-amber-600 hover:to-tv-primary'
      : 'border border-tv-border bg-black/[0.01] text-tv-text hover:border-tv-muted/40 hover:bg-black/[0.04]'

  return (
    <motion.div
      className={fullWidth ? 'w-full' : 'inline-block'}
      whileHover={isDisabled ? undefined : { scale: 1.015 }}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <button
        type={type}
        disabled={isDisabled}
        className={`${baseClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </button>
    </motion.div>
  )
}
