import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:pointer-events-none disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
