import type { ActivityItem, ActivityType } from '../types/activity'
import type { TeamMember } from '../types/team'
import { Avatar } from '../shared/Avatar'

export type ActivityFeedProps = {
  activities: ActivityItem[]
  memberById: Record<string, TeamMember | undefined>
}

function iconFor(type: ActivityType) {
  const common = 'h-4 w-4 shrink-0'
  switch (type) {
    case 'task_completed':
      return (
        <svg className={`${common} text-emerald-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'member_joined':
      return (
        <svg className={`${common} text-violet-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0.41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
        </svg>
      )
    case 'comment':
      return (
        <svg className={`${common} text-sky-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M3.505 2.365A41.188 41.188 0 0 1 10 2c2.236 0 4.43.18 6.503.511.382.062.505.357.005.66C18.178 4.26 15.729 5 12 5c-2.299 0-3.043.225-3.519.438-.453.204-.753.995-.753 1.73V9H6l-2.5 4.5L1 9h2V6.742c0-.703.275-1.389.753-1.59C4.637 4.225 5.385 4 8 4c1.797 0 2.055-.224 2.155-.365Z" />
        </svg>
      )
    case 'file':
      return (
        <svg className={`${common} text-amber-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z" />
        </svg>
      )
    case 'meeting':
      return (
        <svg className={`${common} text-rose-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm0 5h8v8H6V7Z" />
        </svg>
      )
    case 'report':
      return (
        <svg className={`${common} text-indigo-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
        </svg>
      )
    default:
      return null
  }
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function ActivityFeed({ activities, memberById }: ActivityFeedProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      aria-labelledby="activity-feed-heading"
    >
      <h3 id="activity-feed-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        Recent activity
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Live stream across your workspace</p>
      <ol className="mt-4 max-h-[28rem] space-y-4 overflow-y-auto pr-1">
        {activities.map((a) => {
          const member = memberById[a.actorId]
          return (
            <li key={a.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                {iconFor(a.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {member ? (
                    <Avatar name={member.name} src={member.avatarUrl} size="sm" status="none" />
                  ) : null}
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{a.actorName}</span>
                  <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={a.timestamp}>
                    {formatTimestamp(a.timestamp)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{a.message}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
