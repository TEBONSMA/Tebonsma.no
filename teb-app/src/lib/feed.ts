import { ApiError, apiFetch, apiFetchBlob, apiUrl } from './api'

// A member as others see them in the feed; avatar is a path on the API
export interface FeedMember {
  id: string
  name: string
  avatar: string | null
}

export type Visibility = 'public' | 'members'

export interface Attachment {
  id: string
  name: string
  mime: string
  size: number
  isImage: boolean
  url: string
}

export interface Poll {
  options: { id: string; text: string; votes: number }[]
  totalVotes: number
  myVote: string | null
}

export type Answer = 'yes' | 'no'

export interface Rsvp {
  yes: number
  no: number
  mine: Answer | null
}

// What makes a post an event. Times are missing until a date is set.
export interface EventDetails {
  title: string
  location: string
  startsAt: string | null
  endsAt: string | null
  // Whether members can bet on it on TebBet
  betting: boolean
  // Only on closed events, and only for members
  rsvp: Rsvp | null
}

export type EventInput = Omit<EventDetails, 'rsvp'>

export interface Post {
  id: string
  author: FeedMember
  body: string
  visibility: Visibility
  createdAt: string
  editedAt: string | null
  pinned: boolean
  attachments: Attachment[]
  poll: Poll | null
  event: EventDetails | null
  likeCount: number
  liked: boolean
  commentCount: number
  mine: boolean
  reported: boolean
}

export interface Comment {
  id: string
  parentId: string | null
  // Empty for a deleted comment that is kept because it has replies
  author: FeedMember | null
  body: string
  attachments: Attachment[]
  createdAt: string
  deleted: boolean
  likeCount: number
  liked: boolean
  mine: boolean
}

export interface Like {
  liked: boolean
  likeCount: number
}

export interface Report {
  post: Post
  reports: { reporter: FeedMember; reason: string; createdAt: string }[]
}

interface NotificationBase {
  id: string
  excerpt: string
  createdAt: string
  read: boolean
}

export interface FeedNotification extends NotificationBase {
  // The last two go to every member: a new event, and a message from its organizer
  kind: 'comment' | 'reply' | 'event' | 'announcement'
  actor: FeedMember
  postId: string
  commentId: string | null
}

// About a member's mail: a mail that arrived, a mail somebody shared with them, or one that was
// meant to be sent later and wasn't
export interface MailNotification extends NotificationBase {
  kind: 'mail' | 'mail_share' | 'mail_failed'
  // A member the mail came from, who is shown with their picture. Otherwise sender says who it was.
  actor: FeedMember | null
  sender: string
  postId: null
  commentId: null
  mailId: string | null
}

export type Notification = FeedNotification | MailNotification

export interface PostInput {
  body: string
  visibility: Visibility
  attachmentIds: string[]
  pollOptions?: string[]
  event?: EventInput
}

export const SORTS = [
  { value: 'new', label: 'Nyeste' },
  { value: 'old', label: 'Eldste' },
  { value: 'likes', label: 'Mest likt' },
  { value: 'comments', label: 'Mest kommentert' },
] as const
export type Sort = (typeof SORTS)[number]['value']

export const MAX_POST_LENGTH = 5000
export const MAX_COMMENT_LENGTH = 2000
export const MAX_ATTACHMENTS = 10
export const MAX_COMMENT_ATTACHMENTS = 4
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_POLL_OPTIONS = 6
export const MAX_POLL_OPTION_LENGTH = 80

type Token = string | null | undefined

export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined && { body: JSON.stringify(body) }),
})

// Reading works for visitors too, so a login that has run out shows the public feed
// instead of an error
export async function asVisitorIfExpired<T>(token: Token, read: (token: Token) => Promise<T>) {
  try {
    return await read(token)
  } catch (err) {
    if (token && err instanceof ApiError && err.status === 401) return read(null)
    throw err
  }
}

export const listPosts = (token: Token, sort: Sort, offset = 0, limit = 10) =>
  asVisitorIfExpired(token, t =>
    apiFetch<{ posts: Post[]; nextOffset: number | null }>(`/feed/posts?sort=${sort}&offset=${offset}&limit=${limit}`, t),
  )

export const getPost = (token: Token, id: string) =>
  asVisitorIfExpired(token, t => apiFetch<Post>(`/feed/posts/${encodeURIComponent(id)}`, t))

export const createPost = (token: string, input: PostInput) => apiFetch<Post>('/feed/posts', token, json('POST', input))

export const updatePost = (token: string, id: string, input: PostInput) =>
  apiFetch<Post>(`/feed/posts/${id}`, token, json('PATCH', input))

export const deletePost = (token: string, id: string) => apiFetch<unknown>(`/feed/posts/${id}`, token, json('DELETE'))

export const likePost = (token: string, id: string, liked: boolean) =>
  apiFetch<Like>(`/feed/posts/${id}/like`, token, json(liked ? 'PUT' : 'DELETE'))

export const getPostLikers = (token: string, id: string) => apiFetch<FeedMember[]>(`/feed/posts/${id}/likes`, token)

export const pinPost = (token: string, id: string, pinned: boolean) =>
  apiFetch<Post>(`/feed/posts/${id}/pin`, token, json(pinned ? 'PUT' : 'DELETE'))

export const votePoll = (token: string, id: string, optionId: string | null) =>
  apiFetch<Poll>(`/feed/posts/${id}/vote`, token, json('PUT', { optionId }))

export const reportPost = (token: string, id: string, reason: string) =>
  apiFetch<unknown>(`/feed/posts/${id}/report`, token, json('POST', { reason }))

export const listReports = (token: string) => apiFetch<Report[]>('/feed/reports', token)

export const dismissReports = (token: string, id: string) =>
  apiFetch<unknown>(`/feed/posts/${id}/reports`, token, json('DELETE'))

export const listComments = (token: Token, postId: string) =>
  asVisitorIfExpired(token, t => apiFetch<Comment[]>(`/feed/posts/${postId}/comments`, t))

export const addComment = (token: string, postId: string, body: string, parentId: string | null, attachmentIds: string[] = []) =>
  apiFetch<Comment>(`/feed/posts/${postId}/comments`, token, json('POST', { body, parentId, attachmentIds }))

export const deleteComment = (token: string, id: string) => apiFetch<unknown>(`/feed/comments/${id}`, token, json('DELETE'))

export const likeComment = (token: string, id: string, liked: boolean) =>
  apiFetch<Like>(`/feed/comments/${id}/like`, token, json(liked ? 'PUT' : 'DELETE'))

export const getCommentLikers = (token: string, id: string) => apiFetch<FeedMember[]>(`/feed/comments/${id}/likes`, token)

export function uploadAttachment(token: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<Attachment>('/feed/attachments', token, { method: 'POST', body: form })
}

export const getNotifications = (token: string) =>
  // mailUnread is the number of unread mails in the inbox, for the menu
  apiFetch<{ unread: number; mailUnread: number; items: Notification[] }>('/notifications', token)

// Without ids, everything is marked as read
export const markNotificationsRead = (token: string, ids?: string[]) =>
  apiFetch<unknown>('/notifications/read', token, json('POST', ids ? { ids } : {}))

// Files on public posts can be linked to directly. The rest need the login, which a plain
// link or <img> can't send, so they are fetched first and handed over as a local address.
export const isDirect = (visibility: Visibility) => visibility === 'public'

export async function downloadAttachment(token: Token, attachment: Attachment, visibility: Visibility) {
  const link = document.createElement('a')
  link.download = attachment.name
  if (isDirect(visibility)) {
    link.href = apiUrl(attachment.url)
    link.click()
    return
  }
  link.href = URL.createObjectURL(await apiFetchBlob(attachment.url, token))
  link.click()
  // Give the browser a moment to start the download before the address stops working
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000)
}

export const postLink = (id: string) => `${window.location.origin}/feed/${id}`

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

const relative = new Intl.RelativeTimeFormat('nb', { numeric: 'auto' })
const fullDate = new Intl.DateTimeFormat('nb', { dateStyle: 'long', timeStyle: 'short' })
const shortDate = new Intl.DateTimeFormat('nb', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDate = (iso: string) => fullDate.format(new Date(iso))

// "5 minutter siden" for the last week, the date after that
export function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 45) return 'nå'
  if (seconds < 3600) return relative.format(-Math.round(seconds / 60), 'minute')
  if (seconds < 86_400) return relative.format(-Math.round(seconds / 3600), 'hour')
  if (seconds < 7 * 86_400) return relative.format(-Math.round(seconds / 86_400), 'day')
  return shortDate.format(new Date(iso))
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))
