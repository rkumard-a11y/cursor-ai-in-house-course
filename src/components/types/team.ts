import type { ThemeMode } from './dashboard'

export type OnlineStatus = 'online' | 'away' | 'offline'

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export type TeamMember = {
  id: string
  name: string
  role: TeamRole
  avatarUrl?: string
  initials?: string
  status: OnlineStatus
  email?: string
}

export type TeamDashboardContextValue = {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  currentUser: TeamMember
}

export const TEAM_DASHBOARD_THEME_KEY = 'team-dashboard-theme'
