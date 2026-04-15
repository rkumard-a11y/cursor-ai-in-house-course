import type { Project, TeamTask } from '../types/project'
import { Badge } from '../shared/Badge'
import { Card } from '../shared/Card'
import { ProjectCard } from './ProjectCard'

export type OverviewMetric = {
  id: string
  label: string
  value: string | number
  hint: string
  trend: 'up' | 'down' | 'neutral'
  trendLabel: string
}

export type ProjectOverviewProps = {
  metrics: OverviewMetric[]
  projects: Project[]
  openTasks: TeamTask[]
  onCompleteTask: (taskId: string) => void
}

function TrendIcon({ trend }: { trend: OverviewMetric['trend'] }) {
  if (trend === 'up') {
    return (
      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M10 3 17 10h-4v7H7v-7H3l7-7Z" />
      </svg>
    )
  }
  if (trend === 'down') {
    return (
      <svg className="h-4 w-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M10 17 3 10h4V3h6v7h4l-7 7Z" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M4 10h12v2H4v-2Z" />
    </svg>
  )
}

export function ProjectOverview({ metrics, projects, openTasks, onCompleteTask }: ProjectOverviewProps) {
  return (
    <div className="space-y-6">
      <Card title="Project overview" description="Real-time signals for delivery health" padding="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {m.label}
                </p>
                <TrendIcon trend={m.trend} />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{m.value}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{m.hint}</p>
              <div className="mt-2 flex items-center gap-1">
                <Badge variant={m.trend === 'up' ? 'success' : m.trend === 'down' ? 'danger' : 'muted'}>
                  {m.trend === 'up' ? 'Up' : m.trend === 'down' ? 'Watch' : 'Flat'}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">{m.trendLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Active projects
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>

      <Card title="Ready to close" description="Mark work done to refresh charts and the activity feed" padding="md">
        {openTasks.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No open tasks — great momentum.</p>
        ) : (
          <ul className="space-y-2">
            {openTasks.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-white">{t.title}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-500"
                  onClick={() => onCompleteTask(t.id)}
                >
                  Mark complete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
