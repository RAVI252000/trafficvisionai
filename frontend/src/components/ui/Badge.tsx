import type { HTMLAttributes, ReactNode } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  children: ReactNode
}

export function Badge({ variant = 'default', children, className = '', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold'
  
  const variants = {
    primary: 'bg-tv-primary/10 text-tv-primary',
    success: 'bg-tv-emerald/10 text-tv-emerald',
    warning: 'bg-tv-orange/10 text-tv-orange',
    danger: 'bg-red-500/10 text-red-400',
    default: 'bg-white/10 text-tv-muted',
  }

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}
