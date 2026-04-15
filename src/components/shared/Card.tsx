import type { ReactNode } from 'react'

export type CardProps = {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const pad: Record<NonNullable<CardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, title, description, className = '', padding = 'md' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${pad[padding]} ${className}`}
    >
      {title ? (
        <header className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
