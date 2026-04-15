import type { ReactNode } from 'react'
import type { UserProfileUser } from './types'
import { VerifiedBadge } from './VerifiedBadge'

type ProfileIdentityProps = {
  user: UserProfileUser
  titleId: string
  headingLevel: 1 | 2 | 3
  /** Profile action buttons (follow / message / edit) */
  children?: ReactNode
}

export function ProfileIdentity({
  user,
  titleId,
  headingLevel,
  children,
}: ProfileIdentityProps) {
  const headingTags = { 1: 'h1', 2: 'h2', 3: 'h3' } as const
  const HeadingTag = headingTags[headingLevel]

  const avatarAlt =
    user.avatarAlt?.trim() ||
    `${user.displayName}${user.handle ? ` (@${user.handle})` : ''} profile photo`

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
      <div className="-mt-14 flex shrink-0 justify-center sm:-mt-16 sm:justify-start">
        <figure className="relative">
          <img
            src={user.avatarUrl}
            alt={avatarAlt}
            width={128}
            height={128}
            loading="lazy"
            decoding="async"
            className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200 dark:border-slate-900 dark:ring-slate-700 sm:h-32 sm:w-32"
          />
        </figure>
      </div>

      <div className="min-w-0 flex-1 text-center sm:-mt-6 sm:pb-1 sm:text-left">
        <header className="flex flex-col items-center gap-1 sm:items-start">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
            <HeadingTag
              id={titleId}
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white"
            >
              {user.displayName}
            </HeadingTag>
            {user.isVerified ? <VerifiedBadge /> : null}
          </div>
          {user.handle ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="sr-only">Username: </span>@{user.handle}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  )
}
