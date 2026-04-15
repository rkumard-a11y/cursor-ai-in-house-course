import type { ReactNode } from 'react'
import type { StatMetric } from '../types/dashboard'

export type StatWidgetProps = {
  metric: StatMetric
  icon?: ReactNode
}

export function StatWidget({ metric, icon }: StatWidgetProps) {
  return (
    <article
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80 sm:p-5"
      aria-labelledby={`stat-${metric.id}-label`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            id={`stat-${metric.id}-label`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {typeof metric.value === 'number'
              ? metric.value.toLocaleString()
              : metric.value}
          </p>
          {metric.hint ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {metric.hint}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
      </div>
      {metric.trend && metric.trendLabel ? (
        <p
          className={`mt-3 text-xs font-medium ${
            metric.trend === 'up'
              ? 'text-emerald-600 dark:text-emerald-400'
              : metric.trend === 'down'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="sr-only">Trend: </span>
          {metric.trendLabel}
        </p>
      ) : null}
    </article>
  )
}
