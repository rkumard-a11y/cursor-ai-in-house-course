import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { KanbanAssignee, KanbanColumnId, KanbanTask } from './types'
import { TaskCard } from './TaskCard'

export type BoardColumnProps = {
  columnId: KanbanColumnId
  title: string
  hint: string
  tasks: KanbanTask[]
  assigneeById: Record<string, KanbanAssignee | undefined>
  onOpenEdit: (task: KanbanTask) => void
}

export function BoardColumn({ columnId, title, hint, tasks, assigneeById, onOpenEdit }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })
  const ids = tasks.map((t) => t.id)

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${title} column`}
      className={`flex min-h-[min(420px,55vh)] flex-col rounded-2xl border bg-slate-50/80 p-3 transition-colors dark:bg-slate-900/50 ${
        isOver
          ? 'border-violet-400 ring-2 ring-violet-400/30 dark:border-violet-500'
          : 'border-slate-200 dark:border-slate-800'
      }`}
      data-kanban-column={columnId}
    >
      <header className="mb-3 flex items-start justify-between gap-2 px-1">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
          {tasks.length}
        </span>
      </header>

      {/* DnD: column is a droppable; cards are sortable within this SortableContext */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={task.assigneeId ? assigneeById[task.assigneeId] ?? null : null}
              onOpenEdit={onOpenEdit}
            />
          ))}
          {tasks.length === 0 ? (
            <div
              className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-10 text-center dark:border-slate-600 dark:bg-slate-950/30"
              aria-hidden
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Drop tasks here</p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Drag cards from other columns — placeholder lane for reordering
              </p>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  )
}
