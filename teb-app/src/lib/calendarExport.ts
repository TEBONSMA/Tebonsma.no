import { apiFetch, apiUrl } from './api'
import { eventLink, type EventPost } from './events'
import { json } from './feed'

// What of a post ends up in someone's calendar
export type ExportableEvent = Pick<EventPost, 'id' | 'body' | 'event'>

// Google takes the description in the address, which must not grow too long
const MAX_GOOGLE_DETAILS_LENGTH = 1000
// A line in an iCalendar file is at most 75 bytes, not counting the line break
const MAX_ICS_LINE_BYTES = 75

// Only events with a date can be put in a calendar
const hasValidTime = (time: string | null) => Boolean(time && Number.isFinite(new Date(time).getTime()))

export const canExport = ({ event }: ExportableEvent) => hasValidTime(event.startsAt) && hasValidTime(event.endsAt)

const eventUrl = (id: string) => `${window.location.origin}${eventLink(id)}`

const description = ({ id, body }: ExportableEvent, maxBodyLength = Infinity) => {
  const text = body.trim()
  const shortened = text.length > maxBodyLength ? `${text.slice(0, maxBodyLength).trimEnd()}…` : text
  return [shortened, eventUrl(id)].filter(Boolean).join('\n\n')
}

// 2026-10-04T18:00:00.000Z becomes 20261004T180000Z, the form both Google and iCalendar use
const utcStamp = (time: string | Date) =>
  new Date(time)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

// Opens Google Calendar with the event filled in, for the member to save
export function googleCalendarUrl(post: ExportableEvent) {
  if (!canExport(post)) return null
  const { title, location, startsAt, endsAt } = post.event

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${utcStamp(startsAt!)}/${utcStamp(endsAt!)}`,
    details: description(post, MAX_GOOGLE_DETAILS_LENGTH),
  })
  if (location) params.set('location', location)
  return `https://calendar.google.com/calendar/render?${params}`
}

const escapeText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

// Long lines continue on the next one after a space, and are never split inside a character
function fold(line: string) {
  const encoder = new TextEncoder()
  const lines: string[] = []
  let current = ''
  let bytes = 0

  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > MAX_ICS_LINE_BYTES) {
      lines.push(current)
      current = ' '
      bytes = 1
    }
    current += char
    bytes += size
  }

  lines.push(current)
  return lines.join('\r\n')
}

function icsEvent(post: ExportableEvent, now: string) {
  if (!canExport(post)) return []
  const { title, location, startsAt, endsAt } = post.event

  return [
    'BEGIN:VEVENT',
    // The same every time, so importing an event again updates it rather than doubling it
    `UID:${post.id}@tebonsma.no`,
    `DTSTAMP:${now}`,
    `DTSTART:${utcStamp(startsAt!)}`,
    `DTEND:${utcStamp(endsAt!)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description(post))}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    `URL:${eventUrl(post.id)}`,
    'END:VEVENT',
  ]
}

// An iCalendar file, which Apple Calendar, Outlook and Google Calendar's import all read.
// Events without a date are left out.
export function toIcs(posts: ExportableEvent[]) {
  const now = utcStamp(new Date())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TEBONSMA//tebonsma.no//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TEBONSMA',
    ...posts.filter(canExport).flatMap(post => icsEvent(post, now)),
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n')
    .concat('\r\n')
}

const fileName = (title: string) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'arrangement'}.ics`
}

function download(name: string, ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  // Not at once, the browser may still be reading it
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const downloadEvent = (post: ExportableEvent) => download(fileName(post.event.title), toIcs([post]))

export const downloadEvents = (posts: ExportableEvent[]) => download('tebonsma-kalender.ics', toIcs(posts))

// The calendar as an address calendar apps subscribe to and fetch again on their own, so new
// and changed events follow. Visitors get the one with the public events; a member's own has
// the closed ones too and a secret in it, so it is not for sharing.
export const getCalendarFeed = async (token: string | null) =>
  apiUrl(token ? (await apiFetch<{ path: string }>('/me/calendar', token)).path : '/calendar.ics')

// A new address for the member's calendar. The old one stops working.
export const resetCalendarFeed = async (token: string) =>
  apiUrl((await apiFetch<{ path: string }>('/me/calendar', token, json('POST'))).path)

// What makes a calendar app, Apple's above all, offer to subscribe rather than show the file
export const webcalUrl = (feedUrl: string) => feedUrl.replace(/^https?:/, 'webcal:')

// Opens Google Calendar asking whether to add the calendar
export const googleSubscribeUrl = (feedUrl: string) =>
  `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl(feedUrl))}`
