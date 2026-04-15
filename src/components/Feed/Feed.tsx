import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreatePost, type NewPostPayload } from './CreatePost'
import { PostCard } from './PostCard'
import type { FeedComment, FeedPost, FeedUser } from './types'

const CURRENT_USER: FeedUser = {
  id: 'demo-you',
  displayName: 'You',
  handle: 'you',
  avatarUrl:
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=faces',
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const SEED_POSTS: FeedPost[] = [
  {
    id: 'p1',
    author: {
      id: 'u1',
      displayName: 'Alex Rivera',
      handle: 'alexrivera',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    },
    content: 'Shipped a new onboarding flow today. Huge thanks to design for the crisp empty states.',
    images: ['https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop'],
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    likes: 42,
    liked: false,
    comments: [
      {
        id: 'c1',
        author: {
          id: 'u2',
          displayName: 'Sam Okonkwo',
          handle: 'sambuilds',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
        },
        body: 'Looks great in staging. Did you keep the progressive disclosure on step 2?',
        createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
        replies: [
          {
            id: 'c1r1',
            author: {
              id: 'u1',
              displayName: 'Alex Rivera',
              handle: 'alexrivera',
              avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
            },
            body: 'Yes — same pattern as the mock. Fewer fields until they pick a goal.',
            createdAt: new Date(Date.now() - 28 * 60_000).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: 'p2',
    author: {
      id: 'u3',
      displayName: 'Morgan Chen',
      handle: 'morganchen',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    },
    content: 'Weekly reminder: async updates in #delivery by EOD Thursday. Bullets > essays.',
    images: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop',
    ],
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    likes: 18,
    liked: true,
    comments: [],
  },
  {
    id: 'p3',
    author: {
      id: 'u4',
      displayName: 'Rio Nakamura',
      handle: 'rio_n',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    },
    content: 'First week on the team — everyone has been welcoming. Excited to pair on the feed module next sprint.',
    createdAt: new Date(Date.now() - 26 * 60_000 * 60).toISOString(),
    likes: 64,
    liked: false,
    comments: [
      {
        id: 'c2',
        author: {
          id: 'u2',
          displayName: 'Sam Okonkwo',
          handle: 'sambuilds',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
        },
        body: 'Welcome aboard! Ping me anytime for architecture questions.',
        createdAt: new Date(Date.now() - 25 * 60_000 * 60).toISOString(),
      },
    ],
  },
]

export function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>(SEED_POSTS)
  const [infiniteLoading, setInfiniteLoading] = useState(false)
  const [infiniteDone, setInfiniteDone] = useState(false)
  const loadsRef = useRef(0)
  const infiniteLockRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const onToggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
            }
          : p,
      ),
    )
  }, [])

  const onAddComment = useCallback((postId: string, body: string) => {
    const comment: FeedComment = {
      id: uid(),
      author: CURRENT_USER,
      body,
      createdAt: new Date().toISOString(),
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)),
    )
  }, [])

  const onSharePlaceholder = useCallback((postId: string) => {
    void postId
    // Placeholder: open share sheet or copy link
  }, [])

  const onCreate = useCallback((payload: NewPostPayload) => {
    const post: FeedPost = {
      id: uid(),
      author: CURRENT_USER,
      content: payload.content,
      images: payload.imageUrls.length ? payload.imageUrls : undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      comments: [],
    }
    setPosts((prev) => [post, ...prev])
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || infiniteDone) return

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting)
        if (!hit || infiniteLockRef.current || infiniteDone) return
        infiniteLockRef.current = true
        setInfiniteLoading(true)
        window.setTimeout(() => {
          loadsRef.current += 1
          setPosts((prev) => {
            const n = loadsRef.current
            const more: FeedPost = {
              id: `more-${n}`,
              author: {
                id: 'bot',
                displayName: 'Northline Bot',
                handle: 'northline_bot',
              },
              content: `[Infinite scroll placeholder] Loaded batch ${n}. Replace this block with your API cursor and dedupe keys.`,
              createdAt: new Date().toISOString(),
              likes: 0,
              liked: false,
              comments: [],
            }
            return [...prev, more]
          })
          setInfiniteLoading(false)
          infiniteLockRef.current = false
          if (loadsRef.current >= 3) setInfiniteDone(true)
        }, 900)
      },
      { root: null, rootMargin: '120px', threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [infiniteDone])

  const subtitle = useMemo(
    () => 'Posts, reactions, and threads — client-side demo state only.',
    [],
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Social feed</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </header>

      <div className="space-y-6">
        <CreatePost currentUser={CURRENT_USER} onCreate={onCreate} />
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={CURRENT_USER.id}
              currentUser={CURRENT_USER}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
              onSharePlaceholder={onSharePlaceholder}
            />
          ))}
        </div>
      </div>

      <div ref={sentinelRef} className="mt-10 flex min-h-16 flex-col items-center justify-center gap-2 py-6" aria-hidden={false}>
        {infiniteLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Loading more…
          </div>
        ) : infiniteDone ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">You are caught up. Hook your data source to keep scrolling.</p>
        ) : (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">Scroll for infinite scroll placeholder</p>
        )}
      </div>
    </div>
  )
}
