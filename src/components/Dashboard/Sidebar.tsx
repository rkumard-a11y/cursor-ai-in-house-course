import type { SidebarNavItem } from '../types/dashboard'

type SidebarProps = {
  items: SidebarNavItem[]
  activeId: string
  mobileOpen: boolean
  onCloseMobile: () => void
}

function NavIcon({ name }: { name: SidebarNavItem['icon'] }) {
  const common = 'h-5 w-5 shrink-0'
  switch (name) {
    case 'home':
      return (
        <svg className={common} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10.707 1.293a1 1 0 0 0-1.414 0l-7 7A1 1 0 0 0 3 10h1v7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-7h1a1 1 0 0 0 .707-1.707l-7-7Z" />
        </svg>
      )
    case 'tasks':
      return (
        <svg className={common} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm1 2v10h10V5H5Zm2 2h6v2H7V7Zm0 4h6v2H7v-2Z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'calendar':
      return (
        <svg className={common} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 0 0-.75.75V4h-1A2.75 2.75 0 0 0 1.25 6.75v9.5A2.75 2.75 0 0 0 4 19h12a2.75 2.75 0 0 0 2.75-2.75v-9.5A2.75 2.75 0 0 0 16 4h-1V2.75a.75.75 0 0 0-1.5 0V4h-7V2.75A.75.75 0 0 0 5 2h.75ZM4.25 7.5a.25.25 0 0 1 .25-.25h11a.25.25 0 0 1 .25.25V10H4V7.5Z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'settings':
      return (
        <svg className={common} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 0 1-2.11 1.09l-1.8-1.04a1.53 1.53 0 0 0-2.11 2.13l1.04 1.8a1.53 1.53 0 0 1-1.08 2.11 1.53 1.53 0 0 0 0 2.98l1.8 1.04a1.53 1.53 0 0 1 1.09 2.11l-1.04 1.8a1.53 1.53 0 0 0 2.13 2.11l1.8-1.04a1.53 1.53 0 0 1 2.11 1.09c.38 1.56 2.6 1.56 2.98 0a1.53 1.53 0 0 1 2.11-1.09l1.8 1.04a1.53 1.53 0 0 0 2.13-2.11l-1.04-1.8a1.53 1.53 0 0 1 1.09-2.11 1.53 1.53 0 0 0 0-2.98l-1.8-1.04a1.53 1.53 0 0 1-1.09-2.11l1.04-1.8a1.53 1.53 0 0 0-2.13-2.11l-1.8 1.04a1.53 1.53 0 0 1-2.11-1.09ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            clipRule="evenodd"
          />
        </svg>
      )
    default:
      return null
  }
}

export function Sidebar({
  items,
  activeId,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 md:z-30 md:w-20 md:translate-x-0 lg:w-64 ${
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Workspace"
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800 md:justify-center lg:justify-start lg:px-5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white dark:bg-violet-500"
            aria-hidden
          >
            N
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white md:max-lg:sr-only lg:inline">
            Northline
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
          {items.map((item) => {
            const active = item.id === activeId
            return (
              <a
                key={item.id}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500 md:justify-center lg:justify-start ${
                  active
                    ? 'bg-violet-600 text-white shadow-sm dark:bg-violet-500'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onCloseMobile()}
              >
                <NavIcon name={item.icon} />
                <span className="md:max-lg:sr-only lg:inline">{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="hidden border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 lg:block">
          <p className="font-medium text-slate-700 dark:text-slate-300">Workspace</p>
          <p className="mt-1">Demo dashboard · v0.1</p>
        </div>
      </aside>
    </>
  )
}
