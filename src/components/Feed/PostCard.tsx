import { useCallback, useState } from 'react'
import type { FeedPost, FeedUser } from './types'
import { CommentSection } from './CommentSection'
import { UserAvatar } from './UserAvatar'

type PostCardProps = {
  post: FeedPost
  currentUserId: string
  currentUser: FeedUser
  onToggleLike: (postId: string) => void
  onAddComment: (postId: string, body: string) => void
  onSharePlaceholder: (postId: string) => void
}

function formatRelative(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    const diff = Date.now() - t
    const m = Math.floor(diff / 60_000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d ago`
    return new Date(iso).toLocaleDateString()
  } catch {
    return ''
  }
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a8 8 0 01-8 8H8l-5 3v-3a8 8 0 018-8h10z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )
}

export function PostCard({ post, currentUserId, currentUser, onToggleLike, onAddComment, onSharePlaceholder }: PostCardProps) {
  const [showComments, setShowComments] = useState(true)
  const [shareFlash, setShareFlash] = useState(false)

  const handleShare = useCallback(() => {
    onSharePlaceholder(post.id)
    setShareFlash(true)
    window.setTimeout(() => setShareFlash(false), 2000)
  }, [onSharePlaceholder, post.id])

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="p-4 pb-2">
        <div className="flex gap-3">
          <UserAvatar name={post.author.displayName} src={post.author.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-slate-900 dark:text-white">{post.author.displayName}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">@{post.author.handle}</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(post.createdAt)}</p>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">{post.content}</p>
        {post.images?.length ? (
          <div
            className={`mt-3 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {post.images.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="relative block overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img src={url} alt="" className="max-h-80 w-full object-cover transition hover:opacity-95" />
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-2 py-1 dark:border-slate-800">
        <div className="flex flex-1 items-center justify-around gap-1">
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              post.liked
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80'
            }`}
            aria-pressed={post.liked}
          >
            <HeartIcon filled={post.liked} />
            <span>{post.likes}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80"
            aria-expanded={showComments}
          >
            <ChatIcon />
            <span>{post.comments.length}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80`}
          >
            <ShareIcon />
            <span>Share</span>
            {shareFlash ? (
              <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">
                Demo: share queued
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {showComments ? (
        <CommentSection
          postId={post.id}
          comments={post.comments}
          onAddComment={onAddComment}
          currentUser={{
            id: currentUserId,
            displayName: currentUser.displayName,
            handle: currentUser.handle,
            avatarUrl: currentUser.avatarUrl,
          }}
        />
      ) : null}
    </article>
  )
}
