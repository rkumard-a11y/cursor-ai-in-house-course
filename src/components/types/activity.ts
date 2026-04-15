export type ActivityType =
  | 'task_completed'
  | 'member_joined'
  | 'comment'
  | 'file'
  | 'meeting'
  | 'report'

export type ActivityItem = {
  id: string
  type: ActivityType
  message: string
  actorId: string
  actorName: string
  timestamp: string
}
