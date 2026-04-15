import type { DragEndEvent } from '@dnd-kit/core'
import type { KanbanColumnId, KanbanTask } from './types'
import { isKanbanColumnId } from './types'

function sortInColumn(tasks: KanbanTask[], columnId: KanbanColumnId) {
  return tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.order - b.order)
}

export function normalizeKanbanTasks(tasks: KanbanTask[]): KanbanTask[] {
  const cols: KanbanColumnId[] = ['todo', 'in_progress', 'done']
  const out: KanbanTask[] = []
  for (const col of cols) {
    sortInColumn(tasks, col).forEach((t, i) => {
      out.push({ ...t, columnId: col, order: i })
    })
  }
  return out
}

/**
 * Applies a drag-and-drop result to the flat task list and re-normalizes per-column order.
 */
export function applyKanbanDragEnd(tasks: KanbanTask[], event: DragEndEvent): KanbanTask[] {
  const { active, over } = event
  if (!over || active.id === over.id) return tasks

  const activeId = String(active.id)
  const overId = String(over.id)
  const activeTask = tasks.find((t) => t.id === activeId)
  if (!activeTask) return tasks

  const without = tasks.filter((t) => t.id !== activeId)

  let targetColumn: KanbanColumnId
  let insertIndex: number

  if (isKanbanColumnId(overId)) {
    targetColumn = overId
    insertIndex = sortInColumn(without, targetColumn).length
  } else {
    const overTask = without.find((t) => t.id === overId)
    if (!overTask) return tasks
    targetColumn = overTask.columnId
    const col = sortInColumn(without, targetColumn)
    insertIndex = col.findIndex((t) => t.id === overId)
    if (insertIndex < 0) insertIndex = col.length
  }

  const inTarget = sortInColumn(without, targetColumn)
  const moved: KanbanTask = { ...activeTask, columnId: targetColumn }
  const newColList = [...inTarget.slice(0, insertIndex), moved, ...inTarget.slice(insertIndex)]
  const rest = without.filter((t) => t.columnId !== targetColumn)
  const merged = [
    ...rest,
    ...newColList.map((t, i) => ({ ...t, columnId: targetColumn, order: i })),
  ]

  return normalizeKanbanTasks(merged)
}
