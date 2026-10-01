import { apiFetch } from './api'
import { asVisitorIfExpired, json, type Answer, type EventDetails, type FeedMember, type Post, type Rsvp } from './feed'

// An event is a feed post with a title, a place and a time
export type EventPost = Post & { event: EventDetails }

export type EventStatus = 'upcoming' | 'current' | 'past'

export const MAX_EVENT_TITLE_LENGTH = 120
export const MAX_EVENT_LOCATION_LENGTH = 200
export const MAX_ANNOUNCEMENT_LENGTH = 500

type Token = string | null | undefined

// In the order they take place, the ones without a date last. Visitors get the public ones.
export const listEvents = (token: Token) =>
  asVisitorIfExpired(token, t => apiFetch<Post[]>('/events', t)) as Promise<EventPost[]>

// Without an answer, the one given before is taken back
export const setRsvp = (token: string, id: string, answer: Answer | null) =>
  apiFetch<Rsvp>(`/events/${id}/rsvp`, token, json('PUT', { answer }))

export const getRsvps = (token: string, id: string) => apiFetch<Record<Answer, FeedMember[]>>(`/events/${id}/rsvps`, token)

export const sendAnnouncement = (token: string, id: string, body: string) =>
  apiFetch<unknown>(`/events/${id}/announcements`, token, json('POST', { body }))

export const eventLink = (id: string) => `/feed/${id}`

type Time = string | null | undefined

export const getEventStatus = (startDateTime: Time, endDateTime: Time): EventStatus => {
  if (!startDateTime || !endDateTime) return 'upcoming'

  const now = new Date()
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'current'
  return 'past'
}

export const formatEventDate = (startDateTime: Time, endDateTime: Time): string => {
  if (!startDateTime || !endDateTime) return 'Dato kommer snart'

  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

  const isSameDay = start.toDateString() === end.toDateString()

  if (isSameDay) {
    return `${start.toLocaleDateString('nb-NO', dateOptions)} kl. ${start.toLocaleTimeString('nb-NO', timeOptions)} - ${end.toLocaleTimeString('nb-NO', timeOptions)}`
  }

  return `${start.toLocaleDateString('nb-NO', dateOptions)} kl. ${start.toLocaleTimeString('nb-NO', timeOptions)} - ${end.toLocaleDateString('nb-NO', dateOptions)} kl. ${end.toLocaleTimeString('nb-NO', timeOptions)}`
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const getCountdown = (startDateTime: Time): Countdown | null => {
  if (!startDateTime) return null

  const now = new Date()
  const start = new Date(startDateTime)
  const diff = start.getTime() - now.getTime()

  // Only show countdown if less than 30 days away and event hasn't started
  if (diff < 0 || diff > 30 * 24 * 60 * 60 * 1000) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export const formatCountdown = (countdown: Countdown): string => {
  const parts = []

  if (countdown.days > 0) parts.push(`${countdown.days}d`)
  if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours}t`)
  if (countdown.minutes > 0 || countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.minutes}m`)
  parts.push(`${countdown.seconds}s`)

  return parts.join(' ')
}

export const getStatusText = (status: EventStatus): string => {
  switch (status) {
    case 'current':
      return 'Pågår'
    case 'upcoming':
      return 'Planlagt'
    case 'past':
      return 'Gjennomført'
  }
}

export const statusDotClass: Record<EventStatus, string> = {
  current: 'bg-teb-green',
  upcoming: 'bg-teb-orange',
  past: 'bg-white/30',
}

// Between the API's times and what a <input type="datetime-local"> holds, which is the
// time on the member's own clock without a time zone
export function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const time = new Date(iso)
  return new Date(time.getTime() - time.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

// Whether the event takes place on the given day, wholly or partly
export function isOnDay(event: EventDetails, day: Date) {
  if (!event.startsAt || !event.endsAt) return false
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  return new Date(event.startsAt) < dayEnd && new Date(event.endsAt) >= dayStart
}
