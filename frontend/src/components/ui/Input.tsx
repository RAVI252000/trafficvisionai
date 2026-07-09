import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export type InputState = 'default' | 'error' | 'success'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  state?: InputState
  helperText?: string
  containerClassName?: string
}

const stateStyles: Record<InputState, string> = {
  default:
    'border-white/[0.08] hover:border-white/[0.14] focus-within:border-tv-primary focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]',
  error:
    'border-red-500/60 focus-within:border-red-500 focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
  success:
    'border-tv-emerald/60 focus-within:border-tv-emerald focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]',
}

/**
 * Enterprise-grade text input with icon slots, validation states,
 * and accessible focus/hover animations.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      leadingIcon,
      trailingIcon,
      state = 'default',
      helperText,
      containerClassName = '',
      disabled,
      id,
      className = '',
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-')
    const helperId = helperText ? `${inputId}-helper` : undefined

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`space-y-2 ${containerClassName}`}
      >
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-tv-text"
        >
          {label}
        </label>

        <div
          className={`
            group relative flex items-center gap-3 rounded-xl border bg-tv-bg/60
            px-4 transition-all duration-200
            ${stateStyles[state]}
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          {leadingIcon && (
            <span
              className="flex shrink-0 text-tv-muted transition-colors duration-200 group-focus-within:text-tv-primary"
              aria-hidden="true"
            >
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={state === 'error'}
            aria-describedby={helperId}
            className={`
              tv-focus-ring h-12 w-full bg-transparent text-[15px] font-normal
              text-tv-text placeholder:text-tv-muted/70
              focus:outline-none disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {trailingIcon && (
            <span className="flex shrink-0 text-tv-muted">{trailingIcon}</span>
          )}

          {state === 'success' && !trailingIcon && (
            <CheckCircle2
              className="h-[18px] w-[18px] shrink-0 text-tv-emerald"
              aria-hidden="true"
            />
          )}

          {state === 'error' && !trailingIcon && (
            <AlertCircle
              className="h-[18px] w-[18px] shrink-0 text-red-400"
              aria-hidden="true"
            />
          )}
        </div>

        {helperText && (
          <p
            id={helperId}
            className={`text-xs ${
              state === 'error'
                ? 'text-red-400'
                : state === 'success'
                  ? 'text-tv-emerald'
                  : 'text-tv-muted'
            }`}
            role={state === 'error' ? 'alert' : undefined}
          >
            {helperText}
          </p>
        )}
      </motion.div>
    )
  },
)

Input.displayName = 'Input'
