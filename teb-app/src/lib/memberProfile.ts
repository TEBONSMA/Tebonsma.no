import { apiFetch } from './api'
import type { FeedMember, Post } from './feed'

export interface GameRecord {
  game: string
  // Everyone who has a score in the game
  players: number
  record: { score: number; date: string; rank: number } | null
}

// Missing for a member who has never opened TebBet
export interface Coins {
  balance: number
  inPlay: number
  total: number
  // Place on TebBet's leaderboard; equal fortunes share one
  rank: number
}

export interface MemberProfile {
  member: FeedMember
  isYou: boolean
  counts: { posts: number; events: number }
  records: GameRecord[]
  coins: Coins | null
}

export type PostKind = 'posts' | 'events'

// "me" is the member asking, so the site doesn't need to know its own id first
export const OWN_PROFILE = 'meg'

const idOf = (id: string) => encodeURIComponent(id === OWN_PROFILE ? 'me' : id)

export const getMemberProfile = (token: string, id: string) => apiFetch<MemberProfile>(`/members/${idOf(id)}`, token)

export const listMemberPosts = (token: string, id: string, kind: PostKind, offset: number, limit: number) =>
  apiFetch<{ posts: Post[]; nextOffset: number | null }>(
    `/members/${idOf(id)}/posts?kind=${kind}&offset=${offset}&limit=${limit}`,
    token,
  )

export const memberPath = (id: string) => `/medlem/${encodeURIComponent(id)}`

const coinFormat = new Intl.NumberFormat('nb')
export const formatCoins = (n: number) => coinFormat.format(n)
