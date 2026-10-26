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
  // Planned until the protocol group starts it; while it goes on, members check in and vote
  state: 'planlagt' | 'pågår' | 'avsluttet'
  startedAt: string | null
  // Proposals sent in after this can only be taken up if 3/4 demand it (§ 3)
  forslagFrist: string
  sakslisteFrist: string
}

export interface ForslagSummary {
  number: number
  // The proposal this is a motforslag to
  parent: number | null
  // The one it was a motforslag to, before that was withdrawn; now it stands on its own
  withdrawnParent: number | null
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

// --- The årsmøte voting on them (the API's /vedtekter/arsmote and /vedtekter/voteringer)

// An option by its place in the list, or a blank vote
export type Choice = number | 'blank'

export interface Votering {
  id: string
  // kontra: forslag a against forslag b; endelig: forslag a against the vedtekter as they are;
  // opptak: whether forslag a, sent in too late, is taken up; fri: anything else, with its own
  // question and options
  kind: 'kontra' | 'endelig' | 'opptak' | 'fri'
  // "Forslag 3 mot forslag 4", or the question asked
  title: string
  // The two proposals, for and against, or as the protocol group wrote them
  options: string[]
  a: ForslagSummary | null
  b: ForslagSummary | null
  // What is voted on, in full, while it is open
  changes: { a: Change[]; b: Change[] | null } | null
  rule: 'flertall' | 'to-tredjedeler' | 'tre-fjerdedeler'
  // How it is decided, in words
  required: string
  // How many were there when it closed
  present: number | null
  // likt: a tie, until the protocol group has it voted on again or drawn by lot
  status: 'åpen' | 'likt' | 'lukket'
  mine: Choice | null
  // While it is open, only for the protocol group; for each option, and the blank votes
  counts: { phone: number[]; hand: number[]; total: number[]; blank: { phone: number; hand: number; total: number } } | null
  // Votes on phones so far
  voted: number
  // The option that won; none when no option got what it needed
  result: number | null
  // The options that had the same, most votes
  tied: number[] | null
  byLot: boolean
  // A vote again after a tie, and a tie that was voted on again
  gjenvalgAv: string | null
  gjenvalg: boolean
  openedAt: string
  closedAt: string | null
}

// A case on the agenda: proposals to the same paragraphs, or another case the protocol group added
export interface Sak {
  // forslag:3 or punkt:<id>, for the order
  key: string
  title: string
  // The id of another case
  punkt: string | null
  // A proposal sent in after the deadline must be taken up by 3/4 of those present (§ 3)
  forslag: (ForslagSummary & { opptak: 'kreves' | 'tatt-opp' | 'ikke-tatt-opp' | null })[]
  // The vote to hold next: whether a late proposal is taken up, an amendment against its
  // proposal, competing proposals against each other, or the one left against the vedtekter
  next: { a: number; b: number | null; opptak: boolean } | null
  // Being voted on now
  current: boolean
  // Nothing left to vote on
  done: boolean
}

export interface Live {
  arsmote: Arsmote | null
  canManage: boolean
  present: boolean
  attendees: FeedMember[]
  voteringer: Votering[]
  saker: Sak[]
}

export const getLive = (token: string) => apiFetch<Live>('/vedtekter/arsmote/live', token)

export const startArsmote = (token: string) => apiFetch<Live>('/vedtekter/arsmote/start', token, json('POST'))

export const endArsmote = (token: string) => apiFetch<Live>('/vedtekter/arsmote/avslutt', token, json('POST'))

export const checkIn = (token: string) => apiFetch<Live>('/vedtekter/arsmote/oppmote', token, json('POST'))

export const checkInMember = (token: string, memberId: string) =>
  apiFetch<Live>(`/vedtekter/arsmote/oppmote/${memberId}`, token, json('POST'))

export const checkOutMember = (token: string, memberId: string) =>
  apiFetch<Live>(`/vedtekter/arsmote/oppmote/${memberId}`, token, json('DELETE'))

export const openVotering = (token: string, a: number, b: number | null, opptak = false) =>
  apiFetch<Live>('/vedtekter/voteringer', token, json('POST', { a, b, opptak }))

export const openFreeVotering = (token: string, title: string, options: string[], rule: Votering['rule'], sak: string | null) =>
  apiFetch<Live>('/vedtekter/voteringer', token, json('POST', { title, options, rule, sak }))

export const addPunkt = (token: string, title: string) => apiFetch<Live>('/vedtekter/arsmote/saker', token, json('POST', { title }))

export const removePunkt = (token: string, id: string) => apiFetch<Live>(`/vedtekter/arsmote/saker/${id}`, token, json('DELETE'))

export const setAgenda = (token: string, order: string[]) => apiFetch<Live>('/vedtekter/arsmote/saksliste', token, json('PUT', { order }))

export const castVote = (token: string, id: string, choice: Choice) =>
  apiFetch<Live>(`/vedtekter/voteringer/${id}/stem`, token, json('POST', { choice }))

export const closeVotering = (token: string, id: string, hand: { options: number[]; blank: number }) =>
  apiFetch<Live>(`/vedtekter/voteringer/${id}/lukk`, token, json('POST', { hand }))

// After a tie: the lot drawn in the room, or drawn by the API
export const drawLot = (token: string, id: string, option: number | 'tilfeldig') =>
  apiFetch<Live>(`/vedtekter/voteringer/${id}/loddtrekning`, token, json('POST', { option }))

// After a tie: vote again on the options kept
export const revote = (token: string, id: string, keep: number[]) => apiFetch<Live>(`/vedtekter/voteringer/${id}/gjenvalg`, token, json('POST', { keep }))

// Where the protocol group writes what was adopted into the vedtekter, after the årsmøte
export const ADOPT_WORKFLOW = 'https://github.com/TEBONSMA/vedtekter/actions/workflows/arsmote.yml'
