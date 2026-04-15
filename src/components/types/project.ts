export type ProjectStatus = 'on_track' | 'at_risk' | 'paused'

export type Milestone = {
  id: string
  label: string
  date: string
  done: boolean
}

export type Project = {
  id: string
  name: string
  description: string
  status: ProjectStatus
  progressPercent: number
  milestones: Milestone[]
}

export type TeamTask = {
  id: string
  title: string
  done: boolean
  projectId: string
}
