import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { SelectInput } from './SelectInput'
import { SettingsTabs, settingsPanelId, settingsTabId } from './SettingsTabs'
import { TextAreaInput } from './TextAreaInput'
import { TextInput } from './TextInput'
import { ToggleSwitch } from './ToggleSwitch'
import type { SettingsTabConfig, SettingsTabId } from './types'

const TABS: SettingsTabConfig[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'appearance', label: 'Appearance' },
]

type FormState = {
  displayName: string
  email: string
  bio: string
  emailDigest: boolean
  pushEnabled: boolean
  weeklySummary: boolean
  quietHours: string
  showEmailPublic: boolean
  analytics: boolean
  marketing: boolean
  themePreference: string
  reduceMotion: boolean
}

const INITIAL: FormState = {
  displayName: 'Jordan Lee',
  email: 'jordan@example.com',
  bio: 'Building accessible interfaces for internal tools.',
  emailDigest: true,
  pushEnabled: false,
  weeklySummary: true,
  quietHours: '22-08',
  showEmailPublic: false,
  analytics: true,
  marketing: false,
  themePreference: 'system',
  reduceMotion: false,
}

function cloneInitial(): FormState {
  return { ...INITIAL }
}

export function SettingsPanel() {
  const idPrefix = useId().replace(/:/g, '')
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')
  const [form, setForm] = useState<FormState>(() => cloneInitial())
  const snapshot = useRef<FormState>(cloneInitial())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)

  const quietOptions = useMemo(
    () => [
      { value: 'off', label: 'Off' },
      { value: '22-08', label: '10:00 PM – 8:00 AM' },
      { value: 'all', label: 'Mute all day (demo)' },
    ],
    [],
  )

  const themeOptions = useMemo(
    () => [
      { value: 'system', label: 'System default' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
    [],
  )

  const validate = useCallback((f: FormState) => {
    const next: Record<string, string> = {}
    if (!f.displayName.trim()) {
      next.displayName = 'Display name is required.'
    }
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    return next
  }, [])

  const handleSave = useCallback(() => {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('Fix the highlighted fields, then try again.')
      return
    }
    snapshot.current = { ...form }
    setStatus('Settings saved (demo — wire to your API).')
    window.setTimeout(() => setStatus(null), 4000)
  }, [form, validate])

  const handleCancel = useCallback(() => {
    setForm({ ...snapshot.current })
    setErrors({})
    setStatus('Changes discarded.')
    window.setTimeout(() => setStatus(null), 2500)
  }, [])

  const tabPanelClass =
    'rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6 lg:p-8'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage your profile, notifications, privacy, and appearance. Save runs basic
          client-side validation placeholders.
        </p>
      </header>

      <div
        className="overflow-hidden rounded-t-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40"
        role="region"
        aria-label="Settings form"
      >
        <SettingsTabs
          idPrefix={idPrefix}
          tabs={TABS}
          activeId={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-3 sm:p-4 lg:p-5">
          <div
            id={settingsPanelId(idPrefix, 'profile')}
            role="tabpanel"
            aria-labelledby={settingsTabId(idPrefix, 'profile')}
            hidden={activeTab !== 'profile'}
            className={activeTab === 'profile' ? tabPanelClass : 'hidden'}
          >
            <div className="space-y-6">
              <TextInput
                id="settings-display-name"
                label="Display name"
                value={form.displayName}
                onChange={(v) => setForm((s) => ({ ...s, displayName: v }))}
                hint="Shown across the workspace and shared links."
                error={errors.displayName}
                autoComplete="name"
              />
              <TextInput
                id="settings-email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((s) => ({ ...s, email: v }))}
                hint="Used for sign-in and security alerts."
                error={errors.email}
                autoComplete="email"
              />
              <TextAreaInput
                id="settings-bio"
                label="Bio"
                value={form.bio}
                onChange={(v) => setForm((s) => ({ ...s, bio: v }))}
                hint="A short introduction teammates will see on your profile card."
                rows={5}
              />
            </div>
          </div>

          <div
            id={settingsPanelId(idPrefix, 'notifications')}
            role="tabpanel"
            aria-labelledby={settingsTabId(idPrefix, 'notifications')}
            hidden={activeTab !== 'notifications'}
            className={activeTab === 'notifications' ? tabPanelClass : 'hidden'}
          >
            <div className="space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-0">
                <ToggleSwitch
                  id="toggle-email-digest"
                  label="Email digest"
                  description="Daily summary of mentions, assignments, and approvals."
                  checked={form.emailDigest}
                  onChange={(v) => setForm((s) => ({ ...s, emailDigest: v }))}
                />
              </div>
              <div className="pt-8">
                <ToggleSwitch
                  id="toggle-push"
                  label="Push notifications"
                  description="Browser alerts for urgent incidents and on-call pages."
                  checked={form.pushEnabled}
                  onChange={(v) => setForm((s) => ({ ...s, pushEnabled: v }))}
                />
              </div>
              <div className="pt-8">
                <ToggleSwitch
                  id="toggle-weekly"
                  label="Weekly summary"
                  description="Friday recap with throughput and blockers."
                  checked={form.weeklySummary}
                  onChange={(v) => setForm((s) => ({ ...s, weeklySummary: v }))}
                />
              </div>
              <div className="pt-8">
                <SelectInput
                  id="quiet-hours"
                  label="Quiet hours"
                  hint="Demo-only preset; connect to your notification service later."
                  value={form.quietHours}
                  onChange={(v) => setForm((s) => ({ ...s, quietHours: v }))}
                  options={quietOptions}
                />
              </div>
            </div>
          </div>

          <div
            id={settingsPanelId(idPrefix, 'privacy')}
            role="tabpanel"
            aria-labelledby={settingsTabId(idPrefix, 'privacy')}
            hidden={activeTab !== 'privacy'}
            className={activeTab === 'privacy' ? tabPanelClass : 'hidden'}
          >
            <div className="space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-0">
                <ToggleSwitch
                  id="toggle-show-email"
                  label="Show work email on profile"
                  description="Only visible to authenticated teammates when enabled."
                  checked={form.showEmailPublic}
                  onChange={(v) => setForm((s) => ({ ...s, showEmailPublic: v }))}
                />
              </div>
              <div className="pt-8">
                <ToggleSwitch
                  id="toggle-analytics"
                  label="Product analytics"
                  description="Help us improve reliability with anonymized usage metrics."
                  checked={form.analytics}
                  onChange={(v) => setForm((s) => ({ ...s, analytics: v }))}
                />
              </div>
              <div className="pt-8">
                <ToggleSwitch
                  id="toggle-marketing"
                  label="Product updates & events"
                  description="Occasional email about releases and webinars."
                  checked={form.marketing}
                  onChange={(v) => setForm((s) => ({ ...s, marketing: v }))}
                />
              </div>
            </div>
          </div>

          <div
            id={settingsPanelId(idPrefix, 'appearance')}
            role="tabpanel"
            aria-labelledby={settingsTabId(idPrefix, 'appearance')}
            hidden={activeTab !== 'appearance'}
            className={activeTab === 'appearance' ? tabPanelClass : 'hidden'}
          >
            <div className="space-y-8">
              <SelectInput
                id="theme-preference"
                label="Theme"
                hint="Demo control only — use the global theme toggle in other demos for now."
                value={form.themePreference}
                onChange={(v) => setForm((s) => ({ ...s, themePreference: v }))}
                options={themeOptions}
              />
              <ToggleSwitch
                id="toggle-reduce-motion"
                label="Reduce interface motion"
                description="Placeholder preference; respects OS setting when fully wired."
                checked={form.reduceMotion}
                onChange={(v) => setForm((s) => ({ ...s, reduceMotion: v }))}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <p
            className="order-2 text-center text-sm text-slate-600 sm:order-1 sm:mr-auto sm:text-left dark:text-slate-400"
            role="status"
            aria-live="polite"
          >
            {status ?? '\u00a0'}
          </p>
          <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-offset-slate-950"
              onClick={handleSave}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
