import { type ReactNode } from 'react'
import { DemoHubCart } from './DemoHubCart'

export type DemoHubRoute =
  | 'products'
  | 'profiles'
  | 'feed'
  | 'dashboard'
  | 'team'
  | 'kanban'
  | 'settings'

const MENU: { id: DemoHubRoute; label: string; hint: string }[] = [
  {
    id: 'products',
    label: 'Products',
    hint: 'Catalog · search · filters · checkout · promo codes',
  },
  {
    id: 'profiles',
    label: 'User profiles',
    hint: 'UserProfile layouts',
  },
  {
    id: 'feed',
    label: 'Social feed',
    hint: 'Posts · likes · comments · infinite scroll',
  },
  {
    id: 'dashboard',
    label: 'Task dashboard',
    hint: 'Sidebar · tasks · metrics',
  },
  {
    id: 'team',
    label: 'Team workspace',
    hint: 'Collaboration · charts · activity',
  },
  {
    id: 'kanban',
    label: 'Kanban',
    hint: 'Columns · drag-and-drop · filters',
  },
  {
    id: 'settings',
    label: 'Settings',
    hint: 'Tabs, forms, toggles',
  },
]

type DemoHubLayoutProps = {
  active: DemoHubRoute
  onNavigate: (route: DemoHubRoute) => void
  children: ReactNode
}

export function DemoHubLayout({ active, onNavigate, children }: DemoHubLayoutProps) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4 lg:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">UI demos</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Northline starter</p>
          </div>

          <div className="justify-self-end lg:col-start-3 lg:row-start-1">
            <DemoHubCart />
          </div>

          <nav
            className="-mx-1 col-span-2 flex min-w-0 items-center gap-1 overflow-x-auto px-1 pb-0.5 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:px-0 lg:pb-0"
            aria-label="Demos"
          >
            {MENU.map((item) => {
              const isActive = active === item.id
              return (
                <a
                  key={item.id}
                  href={`?view=${item.id}`}
                  title={item.hint}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate(item.id)
                  }}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold outline-none ring-violet-500/0 transition focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm dark:bg-violet-500'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <div id="demo-hub-main" className="min-w-0">
        {children}
      </div>
    </div>
  )
}
