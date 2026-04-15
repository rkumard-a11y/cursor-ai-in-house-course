export type QuickActionsProps = {
  onCreateTask: () => void
  onAddMember: () => void
  onGenerateReport: () => void
  onScheduleMeeting: () => void
  busyAction: string | null
}

export function QuickActions({
  onCreateTask,
  onAddMember,
  onGenerateReport,
  onScheduleMeeting,
  busyAction,
}: QuickActionsProps) {
  const btn =
    'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800'

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm dark:border-slate-800 dark:from-violet-950/30 dark:to-slate-900"
      aria-labelledby="quick-actions-heading"
    >
      <h3 id="quick-actions-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        Quick actions
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Shortcuts your team uses every day</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" className={btn} onClick={onCreateTask} disabled={busyAction !== null}>
          {busyAction === 'task' ? 'Working…' : 'Create new task'}
        </button>
        <button type="button" className={btn} onClick={onAddMember} disabled={busyAction !== null}>
          {busyAction === 'member' ? 'Working…' : 'Add team member'}
        </button>
        <button type="button" className={btn} onClick={onGenerateReport} disabled={busyAction !== null}>
          {busyAction === 'report' ? 'Working…' : 'Generate report'}
        </button>
        <button type="button" className={btn} onClick={onScheduleMeeting} disabled={busyAction !== null}>
          {busyAction === 'meeting' ? 'Working…' : 'Schedule meeting'}
        </button>
      </div>
    </section>
  )
}
