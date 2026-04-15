export type KanbanColumnId = 'todo' | 'in_progress' | 'done'

export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent'

export type KanbanAssignee = {
  id: string
  name: string
  initials: string
}

export type KanbanTask = {
  id: string
  title: string
  description: string
  columnId: KanbanColumnId
  assigneeId: string | null
  dueDate: string
  priority: KanbanPriority
  /** Sort order within a column (lower = higher on board) */
  order: number
}

export const KANBAN_COLUMNS: { id: KanbanColumnId; title: string; hint: string }[] = [
  { id: 'todo', title: 'Todo', hint: 'Not started' },
  { id: 'in_progress', title: 'In progress', hint: 'Active work' },
  { id: 'done', title: 'Done', hint: 'Shipped' },
]

export const KANBAN_ASSIGNEES: KanbanAssignee[] = [
  { id: 'a1', name: 'Jordan Lee', initials: 'JL' },
  { id: 'a2', name: 'Sam Rivera', initials: 'SR' },
  { id: 'a3', name: 'Alex Chen', initials: 'AC' },
  { id: 'a4', name: 'Rio Santos', initials: 'RS' },
]

export function isKanbanColumnId(id: string): id is KanbanColumnId {
  return id === 'todo' || id === 'in_progress' || id === 'done'
}
