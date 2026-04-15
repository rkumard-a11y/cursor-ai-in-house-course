import { useEffect, useId, useState, type FormEvent } from 'react'
import type { KanbanAssignee, KanbanColumnId, KanbanPriority, KanbanTask } from './types'
import { KANBAN_ASSIGNEES } from './types'

export type AddTaskModalProps = {
  defaultColumn: KanbanColumnId
  onClose: () => void
  onAdd: (task: Omit<KanbanTask, 'id' | 'order'>) => void
}

const priorities: KanbanPriority[] = ['low', 'medium', 'high', 'urgent']

export function AddTaskModal({ defaultColumn, onClose, onAdd }: AddTaskModalProps) {
  const titleId = useId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState<KanbanColumnId>(defaultColumn)
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [priority, setPriority] = useState<KanbanPriority>('medium')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onAdd({
      title: t,
      description: description.trim(),
      columnId,
      assigneeId: assigneeId || null,
      dueDate,
      priority,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-white">
            Add task
          </h2>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Placeholder modal — wired to board state and persistence.
        </p>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="add-title">
              Title
            </label>
            <input
              id="add-title"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="add-desc">
              Description
            </label>
            <textarea
              id="add-desc"
              className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="add-col">
                Column
              </label>
              <select
                id="add-col"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value as KanbanColumnId)}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="add-pri">
                Priority
              </label>
              <select
                id="add-pri"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                value={priority}
                onChange={(e) => setPriority(e.target.value as KanbanPriority)}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="add-due">
                Due date
              </label>
              <input
                id="add-due"
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="add-asg">
                Assignee
              </label>
              <select
                id="add-asg"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {KANBAN_ASSIGNEES.map((a: KanbanAssignee) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 dark:bg-violet-500"
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
