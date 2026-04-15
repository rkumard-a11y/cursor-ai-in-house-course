import type { Project } from '../types/project'
import { Badge } from '../shared/Badge'

type ProjectCardProps = {
  project: Project
}

function statusBadge(status: Project['status']) {
  switch (status) {
    case 'on_track':
      return <Badge variant="success">On track</Badge>
    case 'at_risk':
      return <Badge variant="warning">At risk</Badge>
    case 'paused':
      return <Badge variant="muted">Paused</Badge>
    default:
      return null
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white">{project.name}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
        </div>
        {statusBadge(project.status)}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Progress</span>
          <span>{project.progressPercent}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={project.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${project.name} completion`}
        >
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500 dark:bg-violet-400"
            style={{ width: `${project.progressPercent}%` }}
          />
        </div>
      </div>
    </article>
  )
}
