import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DASHBOARD_THEME_KEY,
  type DashboardUser,
  type StatMetric,
  type Task,
  type ThemeMode,
} from '../types/dashboard'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { StatWidget } from './StatWidget'
import { TaskCard } from './TaskCard'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', href: '#dashboard', icon: 'home' as const },
  { id: 'tasks', label: 'Tasks', href: '#tasks', icon: 'tasks' as const },
  { id: 'calendar', label: 'Calendar', href: '#calendar', icon: 'calendar' as const },
  { id: 'settings', label: 'Settings', href: '#settings', icon: 'settings' as const },
]

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Ship accessibility audit fixes',
    description:
      'Address contrast issues on billing screens and verify focus order for keyboard-only flows.',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: new Date().toISOString().slice(0, 10),
    assignee: 'alex',
  },
  {
    id: 't2',
    title: 'Draft Q2 roadmap review',
    description:
      'Consolidate team inputs, attach metrics snapshot, and circulate for async comments.',
    priority: 'high',
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    assignee: 'sam',
  },
  {
    id: 't3',
    title: 'Migrate legacy webhooks',
    description:
      'Dual-write events to the new pipeline, monitor error rates, then cut traffic over.',
    priority: 'medium',
    status: 'blocked',
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10),
  },
  {
    id: 't4',
    title: 'Update onboarding checklist',
    description:
      'Align copy with the latest product tour and add deep links to the help center.',
    priority: 'low',
    status: 'done',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    assignee: 'rio',
  },
]

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const v = localStorage.getItem(DASHBOARD_THEME_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function readActiveNavId(): string {
  if (typeof window === 'undefined') return 'tasks'
  const raw = window.location.hash.replace(/^#/, '')
  if (raw && NAV.some((n) => n.id === raw)) return raw
  return 'tasks'
}

const defaultUser: DashboardUser = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  avatarUrl:
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=128&h=128&fit=crop&crop=faces',
}

export function Dashboard() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())
  const [activeNavId, setActiveNavId] = useState<string>(() => readActiveNavId())
  const [tasks] = useState<Task[]>(INITIAL_TASKS)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(DASHBOARD_THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    const onHash = () => setActiveNavId(readActiveNavId())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setPulse((p) => p + 1), 8000)
    return () => window.clearInterval(id)
  }, [])

  const metrics: StatMetric[] = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const doneWeek = tasks.filter((t) => t.status === 'done').length
    const blocked = tasks.filter((t) => t.status === 'blocked').length
    void pulse
    return [
      {
        id: 'open',
        label: 'Open tasks',
        value: open,
        hint: 'Across active projects',
        trend: 'neutral' as const,
        trendLabel: 'Snapshot refreshes on a timer (demo)',
      },
      {
        id: 'progress',
        label: 'In progress',
        value: inProgress,
        hint: 'Actively owned this week',
        trend: 'neutral' as const,
        trendLabel: 'Updated live from board',
      },
      {
        id: 'done',
        label: 'Completed (demo)',
        value: doneWeek,
        hint: 'Last 7 days · sample data',
        trend: 'up' as const,
        trendLabel: '+1 vs prior snapshot',
      },
      {
        id: 'blocked',
        label: 'Blocked',
        value: blocked,
        hint: 'Needs unblocking',
        trend: blocked ? ('down' as const) : ('neutral' as const),
        trendLabel: blocked ? 'Resolve dependencies' : 'No blocked items',
      },
    ]
  }, [tasks, pulse])

  const onThemeChange = useCallback((mode: ThemeMode) => {
    setTheme(mode)
  }, [])

  const pageTitle = NAV.find((n) => n.id === activeNavId)?.label ?? 'Workspace'

  return (
    <div className="flex min-h-dvh min-w-0 flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        items={NAV}
        activeId={activeNavId}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-h-dvh min-w-0 flex-col md:pl-20 lg:pl-64">
        <Header
          user={defaultUser}
          theme={theme}
          onThemeChange={onThemeChange}
          pageTitle={pageTitle}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <section
            id="dashboard"
            aria-labelledby="dashboard-heading"
            className="scroll-mt-20 space-y-6"
          >
            <div>
              <h2
                id="dashboard-heading"
                className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
              >
                Overview
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Snapshot metrics refresh on an interval for this demo.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((m) => (
                <StatWidget
                  key={m.id}
                  metric={m}
                  icon={
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm1 6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />
                    </svg>
                  }
                />
              ))}
            </div>
          </section>

          <section
            id="tasks"
            aria-labelledby="tasks-heading"
            className="scroll-mt-20 space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="tasks-heading"
                  className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
                >
                  Task board
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Priority colors and status markers follow consistent patterns for scanning.
                </p>
              </div>
            </div>
            <ul className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskCard task={task} />
                </li>
              ))}
            </ul>
          </section>

          <section
            id="calendar"
            aria-labelledby="calendar-heading"
            className="scroll-mt-20 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40"
          >
            <h2
              id="calendar-heading"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              Calendar
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Placeholder section for scheduling views. Hook your calendar provider here.
            </p>
          </section>

          <section
            id="settings"
            aria-labelledby="settings-heading"
            className="scroll-mt-20 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40"
          >
            <h2
              id="settings-heading"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              Settings
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Workspace preferences, integrations, and roles would live in this panel.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
