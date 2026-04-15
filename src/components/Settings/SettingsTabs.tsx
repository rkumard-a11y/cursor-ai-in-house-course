import { useCallback, useRef, type KeyboardEvent } from 'react'
import type { SettingsTabConfig, SettingsTabId } from './types'

export type SettingsTabsProps = {
  /** Shared prefix for `id` / `aria-controls` wiring with tab panels */
  idPrefix: string
  tabs: SettingsTabConfig[]
  activeId: SettingsTabId
  onChange: (id: SettingsTabId) => void
}

export function settingsPanelId(prefix: string, tabId: SettingsTabId) {
  return `${prefix}-${tabId}-panel`
}

export function settingsTabId(prefix: string, tabId: SettingsTabId) {
  return `${prefix}-${tabId}-tab`
}

export function SettingsTabs({
  idPrefix,
  tabs,
  activeId,
  onChange,
}: SettingsTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const focusTab = useCallback((index: number) => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-index="${index}"]`,
    )
    el?.focus()
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (index + 1) % tabs.length
        onChange(tabs[next].id)
        focusTab(next)
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (index - 1 + tabs.length) % tabs.length
        onChange(tabs[prev].id)
        focusTab(prev)
      }
      if (e.key === 'Home') {
        e.preventDefault()
        onChange(tabs[0].id)
        focusTab(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        const last = tabs.length - 1
        onChange(tabs[last].id)
        focusTab(last)
      }
    },
    [tabs, onChange, focusTab],
  )

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Settings sections"
        className="-mb-px flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-2"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId
          const panelId = settingsPanelId(idPrefix, tab.id)
          const tabId = settingsTabId(idPrefix, tab.id)
          return (
            <button
              key={tab.id}
              id={tabId}
              type="button"
              role="tab"
              data-tab-index={index}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`rounded-t-lg border px-4 py-3 text-left text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500 sm:min-w-[8.5rem] sm:text-center ${
                selected
                  ? 'border-slate-200 border-b-transparent bg-white text-violet-700 shadow-sm dark:border-slate-700 dark:border-b-transparent dark:bg-slate-950 dark:text-violet-300'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/80'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
