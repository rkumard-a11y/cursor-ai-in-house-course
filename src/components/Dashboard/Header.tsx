import { useEffect, useId, useRef, useState } from 'react'
import type { DashboardUser, ThemeMode } from '../types/dashboard'
import { DarkModeToggle } from './DarkModeToggle'

type HeaderProps = {
  user: DashboardUser
  theme: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
  pageTitle: string
  onOpenSidebar: () => void
  notificationCount?: number
}

export function Header({
  user,
  theme,
  onThemeChange,
  pageTitle,
  onOpenSidebar,
  notificationCount = 3,
}: HeaderProps) {
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const userBtnId = useId().replace(/:/g, '')
  const userMenuId = useId().replace(/:/g, '')
  const notifBtnId = useId().replace(/:/g, '')
  const notifMenuId = useId().replace(/:/g, '')
  const panelRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userOpen && !notifOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserOpen(false)
        setNotifOpen(false)
      }
    }

    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (userOpen) {
        if (panelRef.current?.contains(t)) return
        if (document.getElementById(userBtnId)?.contains(t)) return
        setUserOpen(false)
      }
      if (notifOpen) {
        if (notifRef.current?.contains(t)) return
        if (document.getElementById(notifBtnId)?.contains(t)) return
        setNotifOpen(false)
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [userOpen, notifOpen, userBtnId, notifBtnId])

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 backdrop-blur-md transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
            {pageTitle}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            Today’s focus and team workload
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <DarkModeToggle theme={theme} onChange={onThemeChange} />

          <div className="relative">
            <button
              id={notifBtnId}
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-expanded={notifOpen}
              aria-haspopup="menu"
              aria-controls={notifMenuId}
              onClick={() => {
                setUserOpen(false)
                setNotifOpen((o) => !o)
              }}
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6Z" />
                <path d="M10 18a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Z" />
              </svg>
              {notificationCount > 0 ? (
                <span className="absolute right-1 top-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white dark:bg-rose-500">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              ) : null}
            </button>

            <div
              ref={notifRef}
              id={notifMenuId}
              role="menu"
              aria-labelledby={notifBtnId}
              aria-hidden={!notifOpen}
              className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 transition dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${
                notifOpen
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0'
              } motion-reduce:transition-none`}
            >
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Notifications
              </p>
              <ul className="max-h-72 list-none space-y-1 overflow-y-auto p-0">
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span className="font-medium">Design review</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      Starts in 30 minutes
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span className="font-medium">Task assigned</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      You were added to “API hardening”
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span className="font-medium">Weekly summary</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      12 tasks completed this week
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative">
            <button
              id={userBtnId}
              type="button"
              className="flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-left outline-none transition hover:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-500/50"
              aria-expanded={userOpen}
              aria-haspopup="menu"
              aria-controls={userMenuId}
              onClick={() => {
                setNotifOpen(false)
                setUserOpen((o) => !o)
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-100"
                  aria-hidden
                >
                  {initials}
                </span>
              )}
              <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-slate-800 sm:inline dark:text-slate-100">
                {user.name}
              </span>
            </button>

            <div
              ref={panelRef}
              id={userMenuId}
              role="menu"
              aria-labelledby={userBtnId}
              aria-hidden={!userOpen}
              className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 transition dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${
                userOpen
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0'
              } motion-reduce:transition-none`}
            >
              <div className="border-b border-slate-100 px-2 py-2 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user.name}
                </p>
                {user.email ? (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                ) : null}
              </div>
              <ul className="mt-1 list-none space-y-0.5 p-0">
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setUserOpen(false)}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setUserOpen(false)}
                  >
                    Workspace settings
                  </button>
                </li>
                <li className="border-t border-slate-100 pt-1 dark:border-slate-800">
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={() => setUserOpen(false)}
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
