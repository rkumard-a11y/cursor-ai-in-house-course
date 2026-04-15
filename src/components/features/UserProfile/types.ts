export type ProfileStatLinks = {
  followersHref?: string
  followingHref?: string
  postsHref?: string
}

export type UserProfileUser = {
  /** Stable id for keys and form associations */
  id: string
  displayName: string
  /** Without @; shown as @handle */
  handle?: string
  bio: string
  avatarUrl: string
  /** Describe the photo for screen readers */
  avatarAlt?: string
  /** Shows a verified badge with accessible label */
  isVerified?: boolean
}

export type UserProfileStats = {
  followers: number
  following: number
  posts: number
}

export type UserProfileProps = {
  user: UserProfileUser
  stats: UserProfileStats
  statLinks?: ProfileStatLinks
  /** When true, show Edit profile instead of Follow / Message */
  isOwnProfile?: boolean
  /** Only used when `isOwnProfile` is false */
  isFollowing?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onMessage?: () => void
  onEditProfile?: () => void
  /** Heading level for the display name (default 2) */
  headingLevel?: 1 | 2 | 3
  /** Optional banner behind the header area */
  bannerUrl?: string
  bannerAlt?: string
  className?: string
}
