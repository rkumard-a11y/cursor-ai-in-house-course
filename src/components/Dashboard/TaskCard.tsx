import type { Task, TaskPriority, TaskStatus } from '../types/dashboard'

export type TaskCardProps = {
  task: Task
}

const priorityStyles: Record<
  TaskPriority,
  { bar: string; label: string; text: string }
> = {
  low: {
    bar: 'bg-slate-400 dark:bg-slate-500',
    label: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    text: 'Low',
  },
  medium: {
    bar: 'bg-sky-500 dark:bg-sky-400',
    label: 'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100',
    text: 'Medium',
  },
  high: {
    bar: 'bg-amber-500 dark:bg-amber-400',
    label: 'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100',
    text: 'High',
  },
  urgent: {
    bar: 'bg-rose-600 dark:bg-rose-500',
    label: 'bg-rose-100 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100',
    text: 'Urgent',
  },
}

const statusConfig: Record<
  TaskStatus,
  { label: string; dot: string; ring: string }
> = {
  todo: {
    label: 'To do',
    dot: 'bg-slate-400',
    ring: 'ring-slate-300 dark:ring-slate-600',
  },
  in_progress: {
    label: 'In progress',
    dot: 'bg-sky-500',
    ring: 'ring-sky-300 dark:ring-sky-700',
  },
  done: {
    label: 'Done',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-300 dark:ring-emerald-700',
  },
  blocked: {
    label: 'Blocked',
    dot: 'bg-rose-500',
    ring: 'ring-rose-300 dark:ring-rose-700',
  },
}

export function TaskCard({ task }: TaskCardProps) {
  const p = priorityStyles[task.priority]
  const s = statusConfig[task.status]

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-slate-800 dark:bg-slate-900/80"
      aria-labelledby={`task-${task.id}-title`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${p.bar}`} aria-hidden />
      <div className="p-4 pl-5 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.label}`}
          >
            {p.text}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span
              className={`inline-flex h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ${s.dot} ${s.ring}`}
              aria-hidden
            />
            {s.label}
          </span>
        </div>
        <h3
          id={`task-${task.id}-title`}
          className="mt-3 text-base font-semibold text-slate-900 dark:text-white"
        >
          {task.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {task.description}
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <dt className="sr-only">Due date</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-300">
              <span aria-hidden>Due </span>
              <time dateTime={task.dueDate}>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </dd>
          </div>
          {task.assignee ? (
            <div>
              <dt className="sr-only">Assignee</dt>
              <dd>@{task.assignee}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  )
}
