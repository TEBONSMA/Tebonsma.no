import { apiFetch } from './api'
import { json, type FeedMember } from './feed'

// The vedtekter as the vedtekter repo builds them, for members only (the API's /vedtekter)
export interface Paragraf {
  id: string
  // "9.4"
  nummer: string
  niva: number
  tittel: string
  tittelHtml: string
  // The text as written in the repo, which proposals change
  kilde: string
  html: string
  barn: Paragraf[]
}

export interface Note {
  nummer: number
  html: string
}

export interface Vedtekter {
  tittel: string
  navn: string
  vedtatt: string
  versjon: string
  // YYYY-MM-DD: the last change
  dato: string
  commit: string
  publisert: string
  sammendrag: string
  paragrafer: Paragraf[]
  fotnoter: Note[]
  kilder: Note[]
}

export const getVedtekter = (token: string) => apiFetch<Vedtekter>('/vedtekter', token)

// A link the browser can open like any other PDF, for an hour
export const getPdfLink = (token: string) => apiFetch<{ url: string; utloper: string }>('/vedtekter/pdf/lenke', token)

// Every paragraph in reading order, with the one it is under
export function flatten(paragraphs: Paragraf[], parent: Paragraf | null = null): { paragraph: Paragraf; parent: Paragraf | null }[] {
  return paragraphs.flatMap(paragraph => [{ paragraph, parent }, ...flatten(paragraph.barn, paragraph)])
}

// --- Proposals to change them (the API's /vedtekter/forslag)

export type Status = 'utkast' | 'innsendt' | 'trukket' | 'vedtatt' | 'forkastet'

export const STATUS_LABEL: Record<Status, string> = {
  utkast: 'Utkast',
  innsendt: 'Sendt inn',
  trukket: 'Trukket',
  vedtatt: 'Vedtatt',
  forkastet: 'Forkastet',
}

// The paragraph as it read when a change was written, or as it reads now
export interface Snapshot {
  nummer: string
  tittel: string
  kilde: string
}

export type ChangeInput =
  | { type: 'endre'; target: string; title: string; text: string }
  | { type: 'legge-til'; parent: string | null; after: string | null; title: string; text: string }
  | { type: 'slette'; target: string }

export type Change =
  | { type: 'endre'; target: string; title: string; text: string; original: Snapshot | null; current: Snapshot | null }
  | { type: 'legge-til'; parent: string | null; after: string | null; title: string; text: string }
  | { type: 'slette'; target: string; original: Snapshot | null; current: Snapshot | null }

// What a change touches, in words for the lists
export type ChangeSummary =
  | { type: 'endre' | 'slette'; target: string; paragraph: string | null; title: string }
  | { type: 'legge-til'; title: string; parent: string | null; after: string | null }

export interface Arsmote {
  id: string
  title: string
  startsAt: string
  // Proposals sent in after this can only be taken up if 3/4 demand it (§ 3)
  forslagFrist: string
  sakslisteFrist: string
}

export interface ForslagSummary {
  number: number
  // The proposal this is an amendment to
  parent: number | null
  title: string
  status: Status
  author: FeedMember
  createdAt: string
  submittedAt: string | null
  arsmote: string | null
  late: boolean
  changes: ChangeSummary[]
  amendments: number
  comments: number
}

export interface Comment {
  id: string
  author: FeedMember
  body: string
  createdAt: string
}

export interface Forslag extends Omit<ForslagSummary, 'changes' | 'amendments' | 'comments'> {
  reason: string
  baseCommit: string
  changes: Change[]
  decidedAt: string | null
  amendments: ForslagSummary[]
  comments: Comment[]
  can: { edit: boolean; submit: boolean; withdraw: boolean; decide: boolean; amend: boolean }
}

export interface ForslagList {
  canManage: boolean
  arsmote: Arsmote | null
  forslag: ForslagSummary[]
}

export interface ForslagInput {
  title: string
  reason: string
  changes: ChangeInput[]
  parent?: number
  submit?: boolean
}

export const listForslag = (token: string) => apiFetch<ForslagList>('/vedtekter/forslag', token)

export const getForslag = (token: string, number: number) => apiFetch<Forslag>(`/vedtekter/forslag/${number}`, token)

export const createForslag = (token: string, input: ForslagInput) => apiFetch<Forslag>('/vedtekter/forslag', token, json('POST', input))

export const updateForslag = (token: string, number: number, input: ForslagInput) =>
  apiFetch<Forslag>(`/vedtekter/forslag/${number}`, token, json('PATCH', input))

export const submitForslag = (token: string, number: number) =>
  apiFetch<Forslag>(`/vedtekter/forslag/${number}/send-inn`, token, json('POST'))

export const withdrawForslag = (token: string, number: number) =>
  apiFetch<Forslag>(`/vedtekter/forslag/${number}/trekk`, token, json('POST'))

export const setForslagStatus = (token: string, number: number, status: 'innsendt' | 'vedtatt' | 'forkastet') =>
  apiFetch<Forslag>(`/vedtekter/forslag/${number}/status`, token, json('POST', { status }))

export const addComment = (token: string, number: number, body: string) =>
  apiFetch<Forslag>(`/vedtekter/forslag/${number}/kommentarer`, token, json('POST', { body }))

export const setArsmote = (token: string, title: string, startsAt: string) =>
  apiFetch<Arsmote | null>('/vedtekter/arsmote', token, json('PUT', { title, startsAt }))

// What a change looks like as input again, for editing or for an amendment
export function toInput(change: Change): ChangeInput {
  if (change.type === 'endre') return { type: 'endre', target: change.target, title: change.title, text: change.text }
  if (change.type === 'slette') return { type: 'slette', target: change.target }
  return { type: 'legge-til', parent: change.parent, after: change.after, title: change.title, text: change.text }
}
