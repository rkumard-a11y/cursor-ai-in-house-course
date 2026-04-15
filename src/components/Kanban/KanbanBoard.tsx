import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyKanbanDragEnd, normalizeKanbanTasks } from './kanbanDrag'
import { loadKanbanState, saveKanbanState } from './kanbanStorage'
import { BoardColumn } from './BoardColumn'
import { AddTaskModal } from './AddTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { TaskCardPreview } from './TaskCard'
import type { KanbanColumnId, KanbanPriority, KanbanTask } from './types'
import { KANBAN_ASSIGNEES, KANBAN_COLUMNS } from './types'

function newId() {
  return `kb-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function seedTasks(): KanbanTask[] {
  const d = (days: number) => new Date(Date.now() + 86400000 * days).toISOString().slice(0, 10)
  return normalizeKanbanTasks([
    {
      id: 'k1',
      title: 'Write API spec',
      description: 'OpenAPI document with request examples',
      columnId: 'todo',
      assigneeId: 'a1',
      dueDate: d(1),
      priority: 'high',
      order: 0,
    },
    {
      id: 'k2',
      title: 'Design tokens audit',
      description: 'Verify dark mode contrast on surfaces',
      columnId: 'todo',
      assigneeId: 'a2',
      dueDate: d(4),
      priority: 'medium',
      order: 1,
    },
    {
      id: 'k3',
      title: 'Implement board drag-and-drop',
      description: '@dnd-kit sortable columns',
      columnId: 'in_progress',
      assigneeId: 'a3',
      dueDate: d(0),
      priority: 'urgent',
      order: 0,
    },
    {
      id: 'k4',
      title: 'QA smoke tests',
      description: 'Regression checklist for release',
      columnId: 'in_progress',
      assigneeId: 'a4',
      dueDate: d(2),
      priority: 'high',
      order: 1,
    },
    {
      id: 'k5',
      title: 'Persist board to localStorage',
      description: 'Versioned JSON payload',
      columnId: 'done',
      assigneeId: 'a1',
      dueDate: d(-2),
      priority: 'low',
      order: 0,
    },
  ])
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>(() => loadKanbanState() ?? seedTasks())
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<KanbanPriority | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [addDefaultColumn, setAddDefaultColumn] = useState<KanbanColumnId>('todo')
  const [addModalNonce, setAddModalNonce] = useState(0)
  const [editTask, setEditTask] = useState<KanbanTask | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    saveKanbanState(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const assigneeById = useMemo(
    () => Object.fromEntries(KANBAN_ASSIGNEES.map((a) => [a.id, a])),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    })
  }, [tasks, search, priorityFilter])

  const columnTasks = useCallback(
    (columnId: KanbanColumnId) =>
      filtered
        .filter((t) => t.columnId === columnId)
        .sort((a, b) => a.order - b.order),
    [filtered],
  )

  const activeTask = useMemo(
    () => (activeId ? tasks.find((t) => t.id === activeId) ?? null : null),
    [activeId, tasks],
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    setTasks((prev) => applyKanbanDragEnd(prev, event))
  }, [])

  const openAdd = (col: KanbanColumnId) => {
    setAddDefaultColumn(col)
    setAddModalNonce((n) => n + 1)
    setAddOpen(true)
  }

  const handleAdd = useCallback((payload: Omit<KanbanTask, 'id' | 'order'>) => {
    setTasks((prev) => {
      const next: KanbanTask = {
        ...payload,
        id: newId(),
        order: prev.filter((t) => t.columnId === payload.columnId).length,
      }
      return normalizeKanbanTasks([...prev, next])
    })
  }, [])

  const handleSaveEdit = useCallback((updated: KanbanTask) => {
    setTasks((prev) => {
      const rest = prev.map((t) => (t.id === updated.id ? updated : t))
      return normalizeKanbanTasks(rest)
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="min-w-0 bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8 lg:py-8">
      <header className="mx-auto mb-6 max-w-7xl flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Delivery
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Kanban board</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Drag cards between Todo, In progress, and Done. Filters hide cards without removing them from storage.
            Assign teammates, edit details, and keep state in this browser via localStorage.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 dark:bg-violet-500"
          onClick={() => openAdd('todo')}
        >
          Add task
        </button>
      </header>

      <div className="mx-auto mb-6 max-w-7xl flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="sr-only" htmlFor="kanban-search">
          Search tasks
        </label>
        <input
          id="kanban-search"
          type="search"
          placeholder="Search title or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:max-w-xs"
        />
        <label className="sr-only" htmlFor="kanban-priority">
          Filter by priority
        </label>
        <select
          id="kanban-priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as KanbanPriority | 'all')}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:w-44"
        >
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        {(search.trim() || priorityFilter !== 'all') && (
          <button
            type="button"
            className="text-sm font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
            onClick={() => {
              setSearch('')
              setPriorityFilter('all')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
          {KANBAN_COLUMNS.map((col) => (
            <div key={col.id} className="flex min-w-0 flex-col gap-2">
              <BoardColumn
                columnId={col.id}
                title={col.title}
                hint={col.hint}
                tasks={columnTasks(col.id)}
                assigneeById={assigneeById}
                onOpenEdit={setEditTask}
              />
              <button
                type="button"
                className="rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:border-violet-400 hover:text-violet-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
                onClick={() => openAdd(col.id)}
              >
                + Quick add to {col.title}
              </button>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCardPreview
              task={activeTask}
              assignee={
                activeTask.assigneeId ? assigneeById[activeTask.assigneeId] ?? null : null
              }
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {addOpen ? (
        <AddTaskModal
          key={addModalNonce}
          defaultColumn={addDefaultColumn}
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
        />
      ) : null}
      {editTask ? (
        <EditTaskModal
          key={editTask.id}
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  )
}
