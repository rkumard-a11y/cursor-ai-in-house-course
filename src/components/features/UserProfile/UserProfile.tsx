import { ProfileActions } from './ProfileActions'
import { ProfileBio } from './ProfileBio'
import { ProfileCover } from './ProfileCover'
import { ProfileIdentity } from './ProfileIdentity'
import { ProfileStatsRow } from './ProfileStatsRow'
import type { UserProfileProps } from './types'

export function UserProfile({
  user,
  stats,
  statLinks,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onMessage,
  onEditProfile,
  headingLevel = 2,
  bannerUrl,
  bannerAlt = '',
  className = '',
}: UserProfileProps) {
  const titleId = `profile-title-${user.id}`
  const descId = `profile-bio-${user.id}`
  const bioText = user.bio.trim()

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <ProfileCover bannerUrl={bannerUrl} bannerAlt={bannerAlt} />

      <div className="relative px-4 pb-6 pt-0 sm:px-6 sm:pb-8">
        <ProfileIdentity
          user={user}
          titleId={titleId}
          headingLevel={headingLevel}
        >
          <ProfileActions
            user={user}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onMessage={onMessage}
            onEditProfile={onEditProfile}
          />
        </ProfileIdentity>

        <ProfileBio bioText={bioText} descId={descId} />
        <ProfileStatsRow stats={stats} statLinks={statLinks} />
      </div>
    </article>
  )
}
