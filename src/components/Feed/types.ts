export type FeedUser = {
  id: string
  displayName: string
  handle: string
  avatarUrl?: string
}

export type FeedComment = {
  id: string
  author: FeedUser
  body: string
  createdAt: string
  replies?: FeedComment[]
}

export type FeedPost = {
  id: string
  author: FeedUser
  content: string
  images?: string[]
  createdAt: string
  likes: number
  liked: boolean
  comments: FeedComment[]
}
