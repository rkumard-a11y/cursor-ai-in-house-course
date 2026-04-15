/**
 * E2E-only task harness (plain credentials in localStorage — never ship to production).
 * Open with: `/?e2e=tasks`
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

const LS_USERS = 'e2e_task_users'
const LS_SESSION = 'e2e_task_session'

type UserRecord = { password: string; name: string }
type Session = { email: string }
type TaskRow = { id: string; title: string; completed: boolean }

function loadUsers(): Record<string, UserRecord> {
  try {
    const raw = localStorage.getItem(LS_USERS)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, UserRecord>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, UserRecord>) {
  localStorage.setItem(LS_USERS, JSON.stringify(users))
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(LS_SESSION)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed?.email ? parsed : null
  } catch {
    return null
  }
}

function saveSession(session: Session | null) {
  if (!session) localStorage.removeItem(LS_SESSION)
  else localStorage.setItem(LS_SESSION, JSON.stringify(session))
}

function tasksKey(email: string) {
  return `e2e_tasks:${email}`
}

function loadTasks(email: string): TaskRow[] {
  try {
    const raw = localStorage.getItem(tasksKey(email))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TaskRow[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveTasks(email: string, tasks: TaskRow[]) {
  localStorage.setItem(tasksKey(email), JSON.stringify(tasks))
}

type Screen = 'register' | 'login' | 'app'

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}`
}

export function E2ETaskApp() {
  const [screen, setScreen] = useState<Screen>('login')
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [banner, setBanner] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [taskTitle, setTaskTitle] = useState('')

  useEffect(() => {
    const s = loadSession()
    setSession(s)
    setScreen(s ? 'app' : 'login')
  }, [])

  useEffect(() => {
    if (session?.email) {
      setTasks(loadTasks(session.email))
    } else {
      setTasks([])
    }
  }, [session])

  const persistTasks = useCallback(
    (next: TaskRow[]) => {
      if (!session?.email) return
      saveTasks(session.email, next)
      setTasks(next)
    },
    [session],
  )

  const userLabel = useMemo(
    () => (session?.email ? session.email : ''),
    [session],
  )

  const onRegister = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      setFormError(null)
      const email = regEmail.trim().toLowerCase()
      if (!regName.trim()) {
        setFormError('Name is required.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFormError('Enter a valid email address.')
        return
      }
      if (regPassword.length < 8) {
        setFormError('Password must be at least 8 characters.')
        return
      }
      if (regPassword !== regConfirm) {
        setFormError('Passwords do not match.')
        return
      }
      const users = loadUsers()
      if (users[email]) {
        setFormError('An account with this email already exists.')
        return
      }
      users[email] = { password: regPassword, name: regName.trim() }
      saveUsers(users)
      setBanner('Account created. Sign in with your new credentials.')
      setRegName('')
      setRegEmail('')
      setRegPassword('')
      setRegConfirm('')
      setScreen('login')
    },
    [regConfirm, regEmail, regName, regPassword],
  )

  const onLogin = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      setFormError(null)
      const email = loginEmail.trim().toLowerCase()
      const users = loadUsers()
      const user = users[email]
      if (!user || user.password !== loginPassword) {
        setFormError('Invalid email or password.')
        return
      }
      const next: Session = { email }
      saveSession(next)
      setSession(next)
      setLoginPassword('')
      setBanner(null)
      setScreen('app')
    },
    [loginEmail, loginPassword],
  )

  const onLogout = useCallback(() => {
    saveSession(null)
    setSession(null)
    setTasks([])
    setTaskTitle('')
    setBanner('You have been signed out.')
    setScreen('login')
  }, [])

  const onAddTask = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      setFormError(null)
      const title = taskTitle.trim()
      if (!title) {
        setFormError('Task title is required.')
        return
      }
      if (!session?.email) return
      const next = [...tasks, { id: newId(), title, completed: false }]
      persistTasks(next)
      setTaskTitle('')
    },
    [persistTasks, session, taskTitle, tasks],
  )

  const toggleComplete = useCallback(
    (id: string) => {
      if (!session?.email) return
      const next = tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      )
      persistTasks(next)
    },
    [persistTasks, session, tasks],
  )

  const removeTask = useCallback(
    (id: string) => {
      if (!session?.email) return
      const next = tasks.filter((t) => t.id !== id)
      persistTasks(next)
    },
    [persistTasks, session, tasks],
  )

  return (
    <div
      className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      data-testid="e2e-task-app"
    >
      <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              E2E harness
            </p>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Task workspace</h1>
          </div>
          {session ? (
            <button
              type="button"
              data-testid="logout-button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={onLogout}
            >
              Log out
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {banner ? (
          <p
            className="mb-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-100"
            role="status"
            data-testid="e2e-banner"
          >
            {banner}
          </p>
        ) : null}

        {formError ? (
          <p
            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100"
            role="alert"
            data-testid="e2e-form-error"
          >
            {formError}
          </p>
        ) : null}

        {screen === 'register' ? (
          <section aria-labelledby="register-heading" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 id="register-heading" className="text-xl font-semibold">
              Create account
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Demo-only registration stored in this browser&apos;s localStorage.
            </p>
            <form className="mt-6 space-y-4" onSubmit={onRegister} noValidate>
              <div>
                <label className="text-sm font-semibold" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  data-testid="register-name"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  data-testid="register-email"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  data-testid="register-password"
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="reg-confirm">
                  Confirm password
                </label>
                <input
                  id="reg-confirm"
                  data-testid="register-confirm"
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                data-testid="register-submit"
                className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 dark:bg-violet-500"
              >
                Register
              </button>
              <button
                type="button"
                data-testid="register-back-to-login"
                className="w-full text-sm font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                onClick={() => {
                  setFormError(null)
                  setScreen('login')
                }}
              >
                Back to sign in
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'login' ? (
          <section aria-labelledby="login-heading" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 id="login-heading" className="text-xl font-semibold">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Use an account you registered in this harness, or create a new one.
            </p>
            <form className="mt-6 space-y-4" onSubmit={onLogin} noValidate>
              <div>
                <label className="text-sm font-semibold" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  data-testid="login-email"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  data-testid="login-password"
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                data-testid="login-submit"
                className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 dark:bg-violet-500"
              >
                Sign in
              </button>
              <button
                type="button"
                data-testid="go-to-register"
                className="w-full text-sm font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                onClick={() => {
                  setFormError(null)
                  setScreen('register')
                }}
              >
                Create an account
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'app' && session ? (
          <section aria-labelledby="tasks-heading" className="space-y-6">
            <div>
              <h2 id="tasks-heading" className="text-xl font-semibold" data-testid="tasks-heading">
                Tasks for {userLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Add tasks, mark them complete, or remove them. State persists per user in
                localStorage for this browser only.
              </p>
            </div>

            <form
              onSubmit={onAddTask}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row"
            >
              <input
                data-testid="task-title-input"
                className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Describe the task…"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                aria-label="New task title"
              />
              <button
                type="submit"
                data-testid="task-add"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500 dark:bg-violet-500"
              >
                Add task
              </button>
            </form>

            <ul className="space-y-3" data-testid="task-list" aria-label="Tasks">
              {tasks.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No tasks yet. Add your first one above.
                </li>
              ) : null}
              {tasks.map((t) => (
                <li
                  key={t.id}
                  data-testid="task-row"
                  data-task-id={t.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold" data-testid="task-title">
                      {t.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Status:{' '}
                      <span data-testid="task-status">{t.completed ? 'Done' : 'Open'}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid="task-toggle-complete"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600"
                      onClick={() => toggleComplete(t.id)}
                    >
                      {t.completed ? 'Mark incomplete' : 'Mark complete'}
                    </button>
                    <button
                      type="button"
                      data-testid="task-delete"
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:text-rose-300"
                      onClick={() => removeTask(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  )
}
