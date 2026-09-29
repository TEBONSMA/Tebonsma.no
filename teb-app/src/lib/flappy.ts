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

export const getLeaderboard = (token: string) => apiFetch<Leaderboard>('/flappy/leaderboard', token)

// A run ticket is fetched when a game starts; the server uses it to check the score is plausible
export const startRun = (token: string) =>
  apiFetch<{ runId: string }>('/flappy/runs', token, { method: 'POST' }).then(r => r.runId)

export const submitScore = (token: string, runId: string, score: number) =>
  apiFetch<{ newBest: boolean; leaderboard: Leaderboard }>('/flappy/scores', token, {
    method: 'POST',
    body: JSON.stringify({ runId, score }),
  })
