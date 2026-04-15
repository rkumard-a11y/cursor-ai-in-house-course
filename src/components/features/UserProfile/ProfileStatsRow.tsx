import type { ProfileStatLinks, UserProfileStats } from './types'
import { StatBlock } from './StatBlock'

type ProfileStatsRowProps = {
  stats: UserProfileStats
  statLinks?: ProfileStatLinks
}

export function ProfileStatsRow({ stats, statLinks }: ProfileStatsRowProps) {
  return (
    <section
      className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800"
      aria-label="Profile statistics"
    >
      <div className="flex divide-x divide-slate-100 rounded-xl bg-slate-50/80 dark:divide-slate-800 dark:bg-slate-800/40">
        <StatBlock label="Posts" value={stats.posts} href={statLinks?.postsHref} />
        <StatBlock
          label="Followers"
          value={stats.followers}
          href={statLinks?.followersHref}
        />
        <StatBlock
          label="Following"
          value={stats.following}
          href={statLinks?.followingHref}
        />
      </div>
    </section>
  )
}
