import { apiFetch } from './api'

export interface LeaderboardEntry {
  name: string
  score: number
  date: string
  isYou: boolean
}

export interface Leaderboard {
  top: LeaderboardEntry[]
  you: { score: number; date: string; rank: number } | null
}

// Each game has its own scoreboard, keyed by the game's slug
const path = (game: string, resource: string) => `/games/${encodeURIComponent(game)}/${resource}`

export const getLeaderboard = (token: string, game: string) =>
  apiFetch<Leaderboard>(path(game, 'leaderboard'), token)

// A run ticket is fetched when a game starts; the server uses it to check the score is plausible
export const startRun = (token: string, game: string) =>
  apiFetch<{ runId: string }>(path(game, 'runs'), token, { method: 'POST' }).then(r => r.runId)

export const submitScore = (token: string, game: string, runId: string, score: number) =>
  apiFetch<{ newBest: boolean; leaderboard: Leaderboard }>(path(game, 'scores'), token, {
    method: 'POST',
    body: JSON.stringify({ runId, score }),
  })
