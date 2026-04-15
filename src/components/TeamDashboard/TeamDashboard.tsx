import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeMode } from '../types/dashboard'
import type { ActivityItem } from '../types/activity'
import type { Project, TeamTask } from '../types/project'
import type { TeamDashboardContextValue, TeamMember } from '../types/team'
import { TEAM_DASHBOARD_THEME_KEY } from '../types/team'
import { DarkModeToggle } from '../Dashboard/DarkModeToggle'
import { ActivityFeed } from './ActivityFeed'
import { ProgressChart } from './ProgressChart'
import { ProjectOverview, type OverviewMetric } from './ProjectOverview'
import { QuickActions } from './QuickActions'
import { TeamMembers } from './TeamMembers'

const TeamDashboardContext = createContext<TeamDashboardContextValue | null>(null)

export function useTeamDashboard() {
  const ctx = useContext(TeamDashboardContext)
  if (!ctx) throw new Error('useTeamDashboard must be used within TeamDashboardProvider')
  return ctx
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const v = localStorage.getItem(TEAM_DASHBOARD_THEME_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function newId() {
  return `td-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'u1',
    name: 'Jordan Lee',
    role: 'owner',
    status: 'online',
    email: 'jordan@example.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=128&h=128&fit=crop&crop=faces',
  },
  {
    id: 'u2',
    name: 'Sam Rivera',
    role: 'admin',
    status: 'away',
    email: 'sam@example.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=128&h=128&fit=crop&crop=faces',
  },
  {
    id: 'u3',
    name: 'Alex Chen',
    role: 'member',
    status: 'online',
    email: 'alex@example.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces',
  },
  {
    id: 'u4',
    name: 'Rio Santos',
    role: 'member',
    status: 'offline',
    email: 'rio@example.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces',
  },
]

const PROJECT_TEMPLATES: Project[] = [
  {
    id: 'p1',
    name: 'Northline launch',
    description: 'Hardening checklist, analytics wiring, and rollout comms.',
    status: 'on_track',
    progressPercent: 62,
    milestones: [
      { id: 'm1', label: 'Design freeze', date: new Date(Date.now() - 86400000 * 5).toISOString(), done: true },
      { id: 'm2', label: 'QA sign-off', date: new Date(Date.now() + 86400000 * 2).toISOString(), done: false },
      { id: 'm3', label: 'GA release', date: new Date(Date.now() + 86400000 * 9).toISOString(), done: false },
    ],
  },
  {
    id: 'p2',
    name: 'Integrations v2',
    description: 'Webhook reliability, retries, and customer-facing status page.',
    status: 'at_risk',
    progressPercent: 38,
    milestones: [
      { id: 'm4', label: 'Dual-write', date: new Date(Date.now() - 86400000 * 2).toISOString(), done: true },
      { id: 'm5', label: 'Cutover', date: new Date(Date.now() + 86400000 * 4).toISOString(), done: false },
    ],
  },
]

const INITIAL_TASKS: TeamTask[] = [
  { id: 't1', title: 'Ship accessibility audit fixes', done: false, projectId: 'p1' },
  { id: 't2', title: 'Draft Q2 roadmap review', done: false, projectId: 'p1' },
  { id: 't3', title: 'Migrate legacy webhooks', done: true, projectId: 'p2' },
  { id: 't4', title: 'Update onboarding checklist', done: true, projectId: 'p1' },
  { id: 't5', title: 'Customer health dashboards', done: false, projectId: 'p2' },
  { id: 't6', title: 'Incident runbook refresh', done: false, projectId: 'p2' },
]

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    type: 'task_completed',
    message: 'Closed “Update onboarding checklist”',
    actorId: 'u4',
    actorName: 'Rio Santos',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'a2',
    type: 'comment',
    message: 'Left review notes on the billing epic',
    actorId: 'u2',
    actorName: 'Sam Rivera',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'a3',
    type: 'file',
    message: 'Uploaded Q2 metrics snapshot',
    actorId: 'u1',
    actorName: 'Jordan Lee',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'a4',
    type: 'meeting',
    message: 'Scheduled design critique for Thursday',
    actorId: 'u3',
    actorName: 'Alex Chen',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

function TeamDashboardProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())
  const currentUser = INITIAL_MEMBERS[0]!

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(TEAM_DASHBOARD_THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const value = useMemo<TeamDashboardContextValue>(
    () => ({
      theme,
      setTheme,
      currentUser,
    }),
    [theme, currentUser],
  )

  return <TeamDashboardContext.Provider value={value}>{children}</TeamDashboardContext.Provider>
}

function TeamDashboardShell() {
  const { theme, setTheme, currentUser } = useTeamDashboard()
  const [tasks, setTasks] = useState<TeamTask[]>(INITIAL_TASKS)
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS)
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!banner) return
    const t = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(t)
  }, [banner])

  const completedCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks])
  const totalTasks = tasks.length

  const projectsView = useMemo(
    () =>
      PROJECT_TEMPLATES.map((p) => {
        const subset = tasks.filter((t) => t.projectId === p.id)
        const done = subset.filter((t) => t.done).length
        const total = subset.length
        const progress = total === 0 ? p.progressPercent : Math.round((done / total) * 100)
        return { ...p, progressPercent: progress }
      }),
    [tasks],
  )

  const milestonesFlat = useMemo(
    () => PROJECT_TEMPLATES.flatMap((p) => p.milestones).slice(0, 5),
    [],
  )

  const openTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks])

  const metrics: OverviewMetric[] = useMemo(() => {
    const velocity = `${completedCount} / ${totalTasks} tasks closed`
    return [
      {
        id: 'velocity',
        label: 'Velocity',
        value: velocity,
        hint: 'Across active initiatives',
        trend: completedCount >= 3 ? 'up' : 'neutral',
        trendLabel: completedCount >= 3 ? 'Ahead of demo baseline' : 'Steady throughput',
      },
      {
        id: 'wip',
        label: 'Open tasks',
        value: openTasks.length,
        hint: 'Still on the board',
        trend: openTasks.length > 4 ? 'down' : 'neutral',
        trendLabel: openTasks.length > 4 ? 'Consider swarming' : 'Healthy WIP',
      },
      {
        id: 'team',
        label: 'Team online',
        value: members.filter((m) => m.status === 'online').length,
        hint: 'Responders available now',
        trend: 'up',
        trendLabel: '+1 vs earlier snapshot',
      },
      {
        id: 'risk',
        label: 'At-risk projects',
        value: projectsView.filter((p) => p.status === 'at_risk').length,
        hint: 'Needs executive attention',
        trend: projectsView.some((p) => p.status === 'at_risk') ? 'down' : 'neutral',
        trendLabel: projectsView.some((p) => p.status === 'at_risk') ? 'Unblock dependencies' : 'All clear',
      },
    ]
  }, [completedCount, totalTasks, openTasks.length, members, projectsView])

  const memberById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])) as Record<string, TeamMember | undefined>,
    [members],
  )

  const onCompleteTask = useCallback((taskId: string) => {
    let title = ''
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      title = task?.title ?? ''
      return prev.map((t) => (t.id === taskId ? { ...t, done: true } : t))
    })
    setActivities((prev) => [
      {
        id: newId(),
        type: 'task_completed',
        message: title ? `Completed “${title}”` : 'Completed a task',
        actorId: currentUser.id,
        actorName: currentUser.name,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
    setBanner('Charts and activity feed updated from that completion.')
  }, [currentUser])

  const onMessage = useCallback((member: TeamMember) => {
    setBanner(`Message stub: open DM with ${member.name}`)
  }, [])

  const onEmail = useCallback((member: TeamMember) => {
    if (member.email) window.location.href = `mailto:${member.email}`
    else setBanner(`${member.name} has no email on file`)
  }, [])

  const runQuick = useCallback((key: string, fn: () => void) => {
    setBusyAction(key)
    window.setTimeout(() => {
      fn()
      setBusyAction(null)
    }, 450)
  }, [])

  const onCreateTask = useCallback(() => {
    runQuick('task', () => {
      const title = window.prompt('Task title', 'Document rollout checklist')
      if (!title?.trim()) return
      const id = newId()
      setTasks((prev) => [...prev, { id, title: title.trim(), done: false, projectId: 'p1' }])
      setActivities((prev) => [
        {
          id: newId(),
          type: 'comment',
          message: `Created task “${title.trim()}”`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      setBanner('New task added to the overview list.')
    })
  }, [runQuick, currentUser])

  const onAddMember = useCallback(() => {
    runQuick('member', () => {
      const name = window.prompt('Team member name', 'Jamie Park')
      if (!name?.trim()) return
      const id = newId()
      const slug = encodeURIComponent(name.trim())
      const member: TeamMember = {
        id,
        name: name.trim(),
        role: 'member',
        status: 'online',
        email: `${slug.replace(/%/g, '')}@example.com`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${slug}`,
      }
      setMembers((prev) => [...prev, member])
      setActivities((prev) => [
        {
          id: newId(),
          type: 'member_joined',
          message: `${member.name} joined the workspace`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      setBanner('Team roster and activity feed refreshed.')
    })
  }, [runQuick, currentUser])

  const onGenerateReport = useCallback(() => {
    runQuick('report', () => {
      setActivities((prev) => [
        {
          id: newId(),
          type: 'report',
          message: 'Generated weekly delivery report (demo)',
          actorId: currentUser.id,
          actorName: currentUser.name,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      setBanner('Report queued — see activity feed for the entry.')
    })
  }, [runQuick, currentUser])

  const onScheduleMeeting = useCallback(() => {
    runQuick('meeting', () => {
      setActivities((prev) => [
        {
          id: newId(),
          type: 'meeting',
          message: 'Scheduled cross-team sync (demo)',
          actorId: currentUser.id,
          actorName: currentUser.name,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
      setBanner('Meeting invite logged to the feed.')
    })
  }, [runQuick, currentUser])

  return (
    <div className="min-w-0 bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Collaboration
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Project health, delivery charts, and team presence stay in sync as you complete tasks or grow the
              roster.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle theme={theme} onChange={setTheme} />
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs dark:border-slate-700 dark:bg-slate-900">
              <p className="font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
              <p className="text-slate-500 dark:text-slate-400">Signed in</p>
            </div>
          </div>
        </header>

        {banner ? (
          <p
            className="mb-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-100"
            role="status"
            aria-live="polite"
          >
            {banner}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <ProjectOverview
              metrics={metrics}
              projects={projectsView}
              openTasks={openTasks}
              onCompleteTask={onCompleteTask}
            />
            <ProgressChart
              completedCount={completedCount}
              totalTasks={totalTasks}
              milestones={milestonesFlat}
            />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <TeamMembers
              members={members}
              currentUserId={currentUser.id}
              onMessage={onMessage}
              onEmail={onEmail}
            />
            <QuickActions
              onCreateTask={onCreateTask}
              onAddMember={onAddMember}
              onGenerateReport={onGenerateReport}
              onScheduleMeeting={onScheduleMeeting}
              busyAction={busyAction}
            />
            <ActivityFeed activities={activities} memberById={memberById} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TeamDashboard() {
  return (
    <TeamDashboardProvider>
      <TeamDashboardShell />
    </TeamDashboardProvider>
  )
}
