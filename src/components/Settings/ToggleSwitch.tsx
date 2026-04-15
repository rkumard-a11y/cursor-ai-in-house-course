export type ToggleSwitchProps = {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  const labelId = `${id}-label`
  const descId = description ? `${id}-description` : undefined

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <p id={labelId} className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </p>
        {description ? (
          <p
            id={descId}
            className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
          >
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? 'bg-violet-600 dark:bg-violet-500'
            : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform dark:bg-slate-100 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
          aria-hidden
        />
      </button>
    </div>
  )
}
