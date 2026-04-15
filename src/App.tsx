import { useCallback, useEffect, useState } from 'react'
import {
  Dashboard,
  DemoHubLayout,
  Feed,
  KanbanBoard,
  SettingsPanel,
  TeamDashboard,
  type DemoHubRoute,
} from './components'
import { DemoCartProvider } from './context/DemoCartContext'
import { E2ERegistrationWizard } from './pages/E2ERegistrationWizard'
import { E2ETaskApp } from './pages/E2ETaskApp'
import { DemoProductPage } from './pages/DemoProductPage'
import { UserProfileDemoPage } from './pages/UserProfileDemoPage'

const ROUTES: DemoHubRoute[] = [
  'products',
  'profiles',
  'feed',
  'dashboard',
  'team',
  'kanban',
  'settings',
]

function readViewFromUrl(): DemoHubRoute {
  if (typeof window === 'undefined') return 'products'
  const v = new URLSearchParams(window.location.search).get('view')
  if (v === 'catalog' || v === 'navigation') return 'products'
  if (v && ROUTES.includes(v as DemoHubRoute)) return v as DemoHubRoute
  return 'products'
}

function MainApp() {
  const [view, setView] = useState<DemoHubRoute>(() => readViewFromUrl())

  const navigate = useCallback((next: DemoHubRoute) => {
    setView(next)
    const url = new URL(window.location.href)
    url.searchParams.set('view', next)
    window.history.pushState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
  }, [])

  useEffect(() => {
    const onPop = () => setView(readViewFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const view = url.searchParams.get('view')
    if (!view) {
      url.searchParams.set('view', 'products')
      window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
    } else if (view === 'catalog' || view === 'navigation') {
      url.searchParams.set('view', 'products')
      window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
    }
  }, [])

  return (
    <DemoCartProvider>
      <DemoHubLayout active={view} onNavigate={navigate}>
        {view === 'dashboard' ? <Dashboard /> : null}
        {view === 'team' ? <TeamDashboard /> : null}
        {view === 'kanban' ? <KanbanBoard /> : null}
        {view === 'products' ? <DemoProductPage /> : null}
        {view === 'profiles' ? <UserProfileDemoPage /> : null}
        {view === 'feed' ? <Feed /> : null}
        {view === 'settings' ? <SettingsPanel /> : null}
      </DemoHubLayout>
    </DemoCartProvider>
  )
}

function readE2EHarness(): 'tasks' | 'registration' | null {
  if (typeof window === 'undefined') return null
  const e = new URLSearchParams(window.location.search).get('e2e')
  if (e === 'tasks') return 'tasks'
  if (e === 'registration') return 'registration'
  return null
}

export default function App() {
  const [e2eHarness] = useState(readE2EHarness)
  if (e2eHarness === 'tasks') {
    return <E2ETaskApp />
  }
  if (e2eHarness === 'registration') {
    return <E2ERegistrationWizard />
  }
  return <MainApp />
}
