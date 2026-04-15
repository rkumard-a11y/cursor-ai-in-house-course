import { formatCompactCount, statAriaLabel } from './formatStats'

type StatBlockProps = {
  label: string
  value: number
  href?: string
}

export function StatBlock({ label, value, href }: StatBlockProps) {
  const compact = formatCompactCount(value)
  const fullLabel = statAriaLabel(label.toLowerCase(), value)

  const visible = (
    <>
      <span
        aria-hidden
        className="block text-lg font-semibold tabular-nums text-slate-900 dark:text-white sm:text-xl"
      >
        {compact}
      </span>
      <span
        aria-hidden
        className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-sm"
      >
        {label}
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        aria-label={fullLabel}
        className="flex min-h-11 min-w-[4.5rem] flex-1 flex-col items-center justify-center rounded-lg px-2 py-2 text-center text-inherit no-underline outline-none ring-violet-500/0 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-800/80"
      >
        {visible}
      </a>
    )
  }

  return (
    <div
      className="flex min-h-11 min-w-[4.5rem] flex-1 flex-col items-center justify-center px-2 py-2 text-center"
      role="group"
      aria-label={fullLabel}
    >
      {visible}
    </div>
  )
}
