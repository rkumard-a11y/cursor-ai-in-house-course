import type { UserProfileUser } from './types'
import { profileButtonBaseClass } from './styles'

const outlineButtonClass = `${profileButtonBaseClass} border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700`

const primaryButtonClass = `${profileButtonBaseClass} bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400`

type ProfileActionsProps = {
  user: UserProfileUser
  isOwnProfile: boolean
  isFollowing: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onMessage?: () => void
  onEditProfile?: () => void
}

export function ProfileActions({
  user,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
  onMessage,
  onEditProfile,
}: ProfileActionsProps) {
  const followHandler = isFollowing ? onUnfollow : onFollow
  const followLabel = isFollowing ? 'Following' : 'Follow'

  return (
    <div
      role="group"
      aria-label="Profile actions"
      className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
    >
      {isOwnProfile ? (
        <button
          type="button"
          className={outlineButtonClass}
          onClick={onEditProfile}
          disabled={!onEditProfile}
        >
          Edit profile
        </button>
      ) : (
        <>
          <button
            type="button"
            className={isFollowing ? outlineButtonClass : primaryButtonClass}
            aria-pressed={isFollowing}
            aria-label={
              isFollowing
                ? `Following ${user.displayName}. Press to unfollow`
                : `Follow ${user.displayName}`
            }
            onClick={followHandler}
            disabled={!followHandler}
          >
            {followLabel}
          </button>
          <button
            type="button"
            className={outlineButtonClass}
            onClick={onMessage}
            disabled={!onMessage}
          >
            Message
          </button>
        </>
      )}
    </div>
  )
}
