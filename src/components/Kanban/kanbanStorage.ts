import type { KanbanTask } from './types'

export const KANBAN_STORAGE_KEY = 'demo_kanban_board_v1'

export type KanbanPersisted = {
  tasks: KanbanTask[]
}

export function loadKanbanState(): KanbanTask[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KANBAN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as KanbanPersisted
    if (!parsed?.tasks || !Array.isArray(parsed.tasks)) return null
    return parsed.tasks
  } catch {
    return null
  }
}

export function saveKanbanState(tasks: KanbanTask[]) {
  if (typeof window === 'undefined') return
  try {
    const payload: KanbanPersisted = { tasks }
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}
