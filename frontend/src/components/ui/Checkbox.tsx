import { forwardRef, type InputHTMLAttributes } from 'react'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

/**
 * Accessible checkbox with custom styling for the login form.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = '', ...props }, ref) => {
    const checkboxId =
      id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <label
        htmlFor={checkboxId}
        className={`group inline-flex cursor-pointer items-center gap-2.5 ${className}`}
      >
        <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="tv-focus-ring peer sr-only"
            {...props}
          />
          <span
            className="
              absolute inset-0 rounded-[5px] border border-white/[0.15]
              bg-tv-bg/60 transition-all duration-200
              peer-checked:border-tv-primary peer-checked:bg-tv-primary
              peer-focus-visible:outline peer-focus-visible:outline-2
              peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tv-primary
              group-hover:border-white/[0.25]
            "
            aria-hidden="true"
          />
          <svg
            className="relative z-10 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-sm font-medium text-tv-muted select-none">
          {label}
        </span>
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
