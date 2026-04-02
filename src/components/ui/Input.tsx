'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-[var(--bg-primary)] border rounded px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]
            focus:outline-none focus:ring-2 focus:ring-[#818CF8] focus:border-transparent
            transition-colors
            ${error ? 'border-red-500' : 'border-[var(--border)]'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full bg-[var(--bg-primary)] border rounded px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]
            focus:outline-none focus:ring-2 focus:ring-[#818CF8] focus:border-transparent
            transition-colors resize-vertical min-h-[100px]
            ${error ? 'border-red-500' : 'border-[var(--border)]'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Input
