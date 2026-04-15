export { Dashboard } from './Dashboard/Dashboard'
export { TeamDashboard, useTeamDashboard } from './TeamDashboard/TeamDashboard'
export { KanbanBoard } from './Kanban/KanbanBoard'
export type { KanbanTask, KanbanColumnId, KanbanPriority } from './Kanban/types'
export type {
  DashboardUser,
  StatMetric,
  Task,
  TaskPriority,
  TaskStatus,
  ThemeMode,
} from './types/dashboard'
export { DASHBOARD_THEME_KEY } from './types/dashboard'
export {
  SettingsPanel,
  SettingsTabs,
  ToggleSwitch,
  TextInput,
  SelectInput,
  TextAreaInput,
  settingsPanelId,
  settingsTabId,
} from './Settings'
export type {
  SelectInputProps,
  SelectOption,
  SettingsTabConfig,
  SettingsTabId,
  SettingsTabsProps,
  TextAreaInputProps,
  TextInputProps,
  ToggleSwitchProps,
} from './Settings'
export { Feed } from './Feed'
export type { FeedComment, FeedPost, FeedUser, NewPostPayload } from './Feed'
export { DemoHubLayout } from './layout/DemoHubLayout'
export type { DemoHubRoute } from './layout/DemoHubLayout'
export { AppShell } from './layout/AppShell'
export { Button } from './ui/Button'
export { UserProfile } from './features/UserProfile'
export type {
  ProfileStatLinks,
  UserProfileProps,
  UserProfileStats,
  UserProfileUser,
} from './features/UserProfile'
export { ProductCard, RatingStars } from './features/ProductCard'
export type {
  Product,
  ProductCardProps,
  RatingStarsProps,
} from './features/ProductCard'
