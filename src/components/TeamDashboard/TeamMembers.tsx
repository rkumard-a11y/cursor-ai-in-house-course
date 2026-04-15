import type { TeamMember } from '../types/team'
import { Avatar } from '../shared/Avatar'
import { Badge } from '../shared/Badge'

function roleVariant(role: TeamMember['role']) {
  switch (role) {
    case 'owner':
      return 'violet' as const
    case 'admin':
      return 'warning' as const
    case 'member':
      return 'default' as const
    case 'viewer':
      return 'muted' as const
    default:
      return 'default' as const
  }
}

function roleLabel(role: TeamMember['role']) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export type TeamMembersProps = {
  members: TeamMember[]
  currentUserId: string
  onMessage: (member: TeamMember) => void
  onEmail: (member: TeamMember) => void
}

export function TeamMembers({ members, currentUserId, onMessage, onEmail }: TeamMembersProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      aria-labelledby="team-members-heading"
    >
      <h3 id="team-members-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        Team
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{members.length} people on this project</p>
      <ul className="mt-4 space-y-4">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={m.name} src={m.avatarUrl} size="lg" status={m.status} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                  {m.id === currentUserId ? (
                    <Badge variant="violet">You</Badge>
                  ) : null}
                  <Badge variant={roleVariant(m.role)}>{roleLabel(m.role)}</Badge>
                </div>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{m.status}</p>
              </div>
            </div>
            {m.id !== currentUserId ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  onClick={() => onMessage(m)}
                >
                  Message
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/40"
                  onClick={() => onEmail(m)}
                >
                  Email
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick contact hidden for self</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
