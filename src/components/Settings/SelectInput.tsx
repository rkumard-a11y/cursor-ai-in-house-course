import type { SelectHTMLAttributes } from 'react'

export type SelectOption = { value: string; label: string }

export type SelectInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  hint?: string
  error?: string
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'value' | 'onChange'>

export function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  error,
  className = '',
  ...props
}: SelectInputProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-900 dark:text-white"
      >
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-violet-500/0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:bg-slate-900 dark:text-white ${
          error
            ? 'border-rose-500 dark:border-rose-500'
            : 'border-slate-200 dark:border-slate-700'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
