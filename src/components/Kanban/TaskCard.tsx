import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KanbanAssignee, KanbanPriority, KanbanTask } from './types'

const priorityStyles: Record<
  KanbanPriority,
  string
> = {
  low: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
  medium:
    'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100',
  high: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
  urgent:
    'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100',
}

function formatDue(due: string) {
  const d = new Date(due + 'T12:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isPastDue(due: string) {
  const end = new Date(due + 'T23:59:59').getTime()
  return end < Date.now()
}

export type TaskCardPreviewProps = {
  task: KanbanTask
  assignee: KanbanAssignee | null
  onOpenEdit?: (task: KanbanTask) => void
  dragging?: boolean
}

/** Static preview for DragOverlay (no sortable hooks). */
export function TaskCardPreview({ task, assignee, onOpenEdit, dragging }: TaskCardPreviewProps) {
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        dragging ? 'cursor-grabbing shadow-lg ring-2 ring-violet-500/30' : ''
      }`}
    >
      <div className="flex gap-2">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
          aria-hidden
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 4h2v2H7V4Zm5 0h2v2h-2V4ZM7 9h2v2H7V9Zm5 0h2v2h-2V9ZM7 14h2v2H7v-2Zm5 0h2v2h-2v-2Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityStyles[task.priority]}`}
            >
              {task.priority}
            </span>
            <time
              className={`text-xs font-medium ${
                isPastDue(task.dueDate)
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              dateTime={task.dueDate}
            >
              Due {formatDue(task.dueDate)}
            </time>
          </div>
          {onOpenEdit ? (
            <button
              type="button"
              className="mt-1 w-full text-left text-sm font-semibold text-slate-900 hover:text-violet-700 dark:text-white dark:hover:text-violet-300"
              onClick={() => onOpenEdit(task)}
            >
              {task.title}
            </button>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
          )}
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{task.description}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {assignee ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                  {assignee.initials}
                </span>
                {assignee.name}
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export type TaskCardProps = {
  task: KanbanTask
  assignee: KanbanAssignee | null
  onOpenEdit: (task: KanbanTask) => void
}

export function TaskCard({ task, assignee, onOpenEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-0.5 flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label={`Drag to move: ${task.title}`}
          {...listeners}
          {...attributes}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M7 4h2v2H7V4Zm5 0h2v2h-2V4ZM7 9h2v2H7V9Zm5 0h2v2h-2V9ZM7 14h2v2H7v-2Zm5 0h2v2h-2v-2Z" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityStyles[task.priority]}`}
            >
              {task.priority}
            </span>
            <time
              className={`text-xs font-medium ${
                isPastDue(task.dueDate)
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              dateTime={task.dueDate}
            >
              Due {formatDue(task.dueDate)}
            </time>
          </div>
          <button
            type="button"
            className="mt-1 w-full text-left text-sm font-semibold text-slate-900 hover:text-violet-700 dark:text-white dark:hover:text-violet-300"
            onClick={() => onOpenEdit(task)}
          >
            {task.title}
          </button>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{task.description}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {assignee ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                  {assignee.initials}
                </span>
                {assignee.name}
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
