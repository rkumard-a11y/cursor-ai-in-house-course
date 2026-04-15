import { useCallback, useMemo, useState } from 'react'
import { UserProfile } from '../components'
import type { UserProfileStats, UserProfileUser } from '../components'

type DemoScenario = {
  key: string
  /** Short label shown above each card */
  label: string
  user: UserProfileUser
  stats: UserProfileStats
  isOwnProfile?: boolean
  /** Initial follow state for visitor scenarios */
  initiallyFollowing?: boolean
  bannerUrl?: string
  bannerAlt?: string
}

const SCENARIOS: DemoScenario[] = [
  {
    key: 'creator',
    label: 'Creator · visitor (not following)',
    user: {
      id: 'demo-alex',
      displayName: 'Alex Rivera',
      handle: 'alexrivera',
      bio: 'Product designer and occasional photographer. Coffee, typography, and trail runs.',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
      isVerified: true,
    },
    stats: { posts: 342, followers: 128_400, following: 812 },
    initiallyFollowing: false,
    bannerUrl:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop',
    bannerAlt: 'Abstract gradient-style artwork',
  },
  {
    key: 'following',
    label: 'Team lead · visitor (already following)',
    user: {
      id: 'demo-sam',
      displayName: 'Sam Okonkwo',
      handle: 'sambuilds',
      bio: 'Engineering manager @ Northline. I write about teams, delivery, and reliable systems.',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
      isVerified: true,
    },
    stats: { posts: 89, followers: 21_050, following: 1_204 },
    initiallyFollowing: true,
    bannerUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
    bannerAlt: 'Soft blue abstract shapes',
  },
  {
    key: 'own',
    label: 'Signed-in viewer · own profile',
    user: {
      id: 'demo-morgan',
      displayName: 'Morgan Chen',
      handle: 'morganchen',
      bio: 'You are viewing your public profile. Update your bio anytime from settings.',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces',
      isVerified: true,
    },
    stats: { posts: 56, followers: 3_420, following: 610 },
    isOwnProfile: true,
  },
  {
    key: 'minimal',
    label: 'New member · visitor (minimal profile)',
    user: {
      id: 'demo-rio',
      displayName: 'Rio Nakamura',
      handle: 'rio_n',
      bio: '',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
      isVerified: false,
    },
    stats: { posts: 3, followers: 42, following: 28 },
    initiallyFollowing: false,
  },
]

function buildInitialFollowing(): Record<string, boolean> {
  return Object.fromEntries(
    SCENARIOS.filter((s) => !s.isOwnProfile).map((s) => [
      s.user.id,
      Boolean(s.initiallyFollowing),
    ]),
  )
}

export type UserProfileDemoPageProps = {
  sectionId?: string
  headingId?: string
}

export function UserProfileDemoPage({
  sectionId = 'profiles',
  headingId = 'profiles-heading',
}: UserProfileDemoPageProps) {
  const [followingById, setFollowingById] = useState<Record<string, boolean>>(
    buildInitialFollowing,
  )
  const [lastAction, setLastAction] = useState<string | null>(null)

  const announce = useCallback((message: string) => {
    setLastAction(message)
  }, [])

  const scenarios = useMemo(() => SCENARIOS, [])

  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className="scroll-mt-24 py-10 sm:px-6 lg:px-8 lg:py-14"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-0">
      <header className="mx-auto mb-10 max-w-3xl text-center lg:mb-14 lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Components
        </p>
        <h1
          id={headingId}
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
        >
          User profile
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Four sample profiles with different roles, stats, and button states. Resize
          the window to see the layout adapt; use the controls on each card to try
          follow, message, and edit actions.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="min-h-[2.75rem] flex-1 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 sm:px-5"
          aria-live="polite"
          aria-atomic="true"
        >
          {lastAction ? (
            <span>
              <span className="font-medium text-slate-900 dark:text-white">
                Last action:
              </span>{' '}
              {lastAction}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-500">
              Interact with a profile to see feedback here.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setFollowingById(buildInitialFollowing())
            setLastAction('Follow states reset to their defaults.')
          }}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-950"
        >
          Reset follow states
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2 xl:gap-x-10 xl:gap-y-12">
        {scenarios.map((scenario) => {
          const isVisitor = !scenario.isOwnProfile
          const following = followingById[scenario.user.id] ?? false

          return (
            <section
              key={scenario.key}
              aria-labelledby={`demo-heading-${scenario.key}`}
              className="flex min-w-0 flex-col"
            >
              <h2
                id={`demo-heading-${scenario.key}`}
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {scenario.label}
              </h2>
              <UserProfile
                headingLevel={3}
                user={scenario.user}
                stats={scenario.stats}
                isOwnProfile={scenario.isOwnProfile}
                isFollowing={isVisitor ? following : undefined}
                onFollow={
                  isVisitor
                    ? () => {
                        setFollowingById((prev) => ({
                          ...prev,
                          [scenario.user.id]: true,
                        }))
                        announce(`You now follow @${scenario.user.handle ?? scenario.user.id}.`)
                      }
                    : undefined
                }
                onUnfollow={
                  isVisitor
                    ? () => {
                        setFollowingById((prev) => ({
                          ...prev,
                          [scenario.user.id]: false,
                        }))
                        announce(
                          `You unfollowed @${scenario.user.handle ?? scenario.user.id}.`,
                        )
                      }
                    : undefined
                }
                onMessage={
                  isVisitor
                    ? () =>
                        announce(
                          `Message flow for @${scenario.user.handle ?? scenario.user.displayName} (demo).`,
                        )
                    : undefined
                }
                onEditProfile={
                  scenario.isOwnProfile
                    ? () => announce('Edit profile (demo) — open your settings screen here.')
                    : undefined
                }
                statLinks={{
                  postsHref: `#demo-${scenario.key}-posts`,
                  followersHref: `#demo-${scenario.key}-followers`,
                  followingHref: `#demo-${scenario.key}-following`,
                }}
                bannerUrl={scenario.bannerUrl}
                bannerAlt={scenario.bannerAlt}
                className="shadow-md shadow-slate-900/5 dark:shadow-none"
              />
            </section>
          )
        })}
      </div>
      </div>
    </section>
  )
}
