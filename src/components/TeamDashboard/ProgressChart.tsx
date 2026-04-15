import type { Milestone } from '../types/project'
import { Card } from '../shared/Card'

export type ProgressChartProps = {
  completedCount: number
  totalTasks: number
  milestones: Milestone[]
}

export function ProgressChart({ completedCount, totalTasks, milestones }: ProgressChartProps) {
  const pct = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100)
  const remaining = Math.max(0, totalTasks - completedCount)

  return (
    <Card title="Task progress" description="Completion mix and upcoming milestones" padding="lg">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Completion</p>
          <div className="mt-3 flex h-10 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div
              className="flex items-center justify-center bg-emerald-500 text-xs font-bold text-white transition-all duration-500 dark:bg-emerald-600"
              style={{ width: `${pct}%` }}
              title={`${completedCount} completed`}
            >
              {pct >= 12 ? `${pct}%` : ''}
            </div>
            <div
              className="flex flex-1 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              title={`${remaining} open`}
            >
              {remaining > 0 ? `${remaining} open` : 'All done'}
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
              <dt className="text-slate-500 dark:text-slate-400">Done</dt>
              <dd className="text-lg font-semibold text-slate-900 dark:text-white">{completedCount}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
              <dt className="text-slate-500 dark:text-slate-400">Remaining</dt>
              <dd className="text-lg font-semibold text-slate-900 dark:text-white">{remaining}</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Milestone timeline</p>
          <ol className="relative mt-4 space-y-0 border-l border-slate-200 pl-4 dark:border-slate-700">
            {milestones.map((m, i) => (
              <li key={m.id} className="relative mb-6 last:mb-0">
                <span
                  className={`absolute -left-[0.4rem] mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    m.done ? 'bg-emerald-500' : i === 0 ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  aria-hidden
                />
                <div className="pl-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.label}</p>
                  <time
                    className="text-xs text-slate-500 dark:text-slate-400"
                    dateTime={m.date}
                  >
                    {new Date(m.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                  {m.done ? (
                    <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">Done</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}
