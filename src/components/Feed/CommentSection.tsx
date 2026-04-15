import { useId, useState } from 'react'
import type { FeedComment, FeedUser } from './types'
import { UserAvatar } from './UserAvatar'

type CommentSectionProps = {
  postId: string
  comments: FeedComment[]
  onAddComment: (postId: string, body: string) => void
  currentUser: FeedUser
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function CommentItem({ comment, depth = 0 }: { comment: FeedComment; depth?: number }) {
  return (
    <li className={depth > 0 ? 'ml-8 border-l border-slate-200 pl-4 dark:border-slate-700' : ''}>
      <div className="flex gap-3 py-2">
        <UserAvatar name={comment.author.displayName} src={comment.author.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold text-slate-900 dark:text-white">{comment.author.displayName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">@{comment.author.handle}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{comment.body}</p>
        </div>
      </div>
      {comment.replies?.length ? (
        <ul className="space-y-0">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function CommentSection({ postId, comments, onAddComment, currentUser }: CommentSectionProps) {
  const [draft, setDraft] = useState('')
  const fieldId = useId()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    onAddComment(postId, body)
    setDraft('')
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Comments · {comments.length}
      </p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {comments.length === 0 ? (
          <li className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No comments yet. Start the thread.</li>
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </ul>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <UserAvatar name={currentUser.displayName} src={currentUser.avatarUrl} size="sm" className="mt-1" />
        <div className="min-w-0 flex-1">
          <label htmlFor={fieldId} className="sr-only">
            Write a comment
          </label>
          <textarea
            id={fieldId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Write a comment…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-violet-500/0 transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-40 dark:bg-violet-500 dark:hover:bg-violet-400"
            >
              Comment
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
