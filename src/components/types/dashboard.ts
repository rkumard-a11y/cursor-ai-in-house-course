export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked'

export type Task = {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  assignee?: string
}

export type StatMetric = {
  id: string
  label: string
  value: number | string
  hint?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}

export type SidebarNavItem = {
  id: string
  label: string
  href: string
  icon: 'home' | 'tasks' | 'calendar' | 'settings'
}

export type DashboardUser = {
  name: string
  email?: string
  avatarUrl?: string
}

export type ThemeMode = 'light' | 'dark'

export const DASHBOARD_THEME_KEY = 'dashboard-theme'
