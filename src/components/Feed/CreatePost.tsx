import { useId, useState } from 'react'
import type { FeedUser } from './types'
import { UserAvatar } from './UserAvatar'

export type NewPostPayload = {
  content: string
  imageUrls: string[]
}

type CreatePostProps = {
  currentUser: FeedUser
  onCreate: (payload: NewPostPayload) => void
}

export function CreatePost({ currentUser, onCreate }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [imageLine, setImageLine] = useState('')
  const contentId = useId()
  const imagesId = useId()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    const urls = imageLine
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    onCreate({ content: text, imageUrls: urls })
    setContent('')
    setImageLine('')
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <h2 className="sr-only">Create post</h2>
      <div className="flex gap-3">
        <UserAvatar name={currentUser.displayName} src={currentUser.avatarUrl} size="md" />
        <form onSubmit={submit} className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor={contentId} className="sr-only">
              What is on your mind?
            </label>
            <textarea
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Share an update, idea, or win with the team…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-violet-500/0 transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/25 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950"
            />
          </div>
          <div>
            <label htmlFor={imagesId} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Image URLs (optional, comma or newline separated)
            </label>
            <input
              id={imagesId}
              type="text"
              value={imageLine}
              onChange={(e) => setImageLine(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500/0 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="submit"
              disabled={!content.trim()}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-40 dark:bg-violet-500 dark:hover:bg-violet-400"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
