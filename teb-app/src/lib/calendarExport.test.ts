import { beforeEach, describe, expect, it } from 'vitest'
import { canExport, googleCalendarUrl, toIcs, type ExportableEvent } from './calendarExport'

const makePost = (overrides: Partial<ExportableEvent> = {}): ExportableEvent => ({
  id: 'evt-1',
  body: 'Velkommen til arrangementet',
  event: {
    title: 'TEBONSMA kveld',
    location: 'Trondheim',
    startsAt: '2026-10-04T20:00:00+02:00',
    endsAt: '2026-10-04T22:15:00+02:00',
    betting: false,
    rsvp: null,
  },
  ...overrides,
})

describe('calendarExport', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'https://tebonsma.no' } },
      configurable: true,
    })
  })

  it('excludes events missing startsAt or endsAt', () => {
    const missingStart = makePost({ id: 'missing-start', event: { ...makePost().event, startsAt: null } })
    const missingEnd = makePost({ id: 'missing-end', event: { ...makePost().event, endsAt: null } })
    const valid = makePost({ id: 'valid' })

    expect(canExport(missingStart)).toBe(false)
    expect(canExport(missingEnd)).toBe(false)
    expect(canExport(valid)).toBe(true)
    expect(googleCalendarUrl(missingStart)).toBeNull()
    expect(googleCalendarUrl(missingEnd)).toBeNull()

    const ics = toIcs([missingStart, missingEnd, valid])
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(1)
    expect(ics).toContain('UID:valid@tebonsma.no')
    expect(ics).not.toContain('UID:missing-start@tebonsma.no')
    expect(ics).not.toContain('UID:missing-end@tebonsma.no')
  })

  it('excludes events with malformed timestamps', () => {
    const badStart = makePost({ id: 'bad-start', event: { ...makePost().event, startsAt: 'not-a-date' } })
    const badEnd = makePost({ id: 'bad-end', event: { ...makePost().event, endsAt: '2026-13-45T99:00:00Z' } })

    expect(canExport(badStart)).toBe(false)
    expect(canExport(badEnd)).toBe(false)
    expect(googleCalendarUrl(badStart)).toBeNull()
    expect(googleCalendarUrl(badEnd)).toBeNull()

    const ics = toIcs([badStart, badEnd, makePost({ id: 'valid' })])
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(1)
    expect(ics).not.toContain('bad-start')
    expect(ics).not.toContain('bad-end')
  })

  it('uses stable uid and UTC timestamps for Google and iCalendar', () => {
    const post = makePost({ id: 'stable-id' })
    const google = new URL(googleCalendarUrl(post)!)
    const params = google.searchParams

    expect(params.get('dates')).toBe('20261004T180000Z/20261004T201500Z')

    const firstIcs = toIcs([post])
    const secondIcs = toIcs([post])
    expect(firstIcs).toContain('UID:stable-id@tebonsma.no')
    expect(secondIcs).toContain('UID:stable-id@tebonsma.no')
    expect(firstIcs).toContain('DTSTART:20261004T180000Z')
    expect(firstIcs).toContain('DTEND:20261004T201500Z')
  })

  it('escapes commas, semicolons, backslashes and newlines', () => {
    const post = makePost({
      body: 'Linje 1,\nLinje;2\\3',
      event: {
        ...makePost().event,
        title: 'Hei, du; test\\ok',
        location: 'Bakklandet, Trondheim; Brygge\\A',
      },
    })

    const ics = toIcs([post])
    expect(ics).toContain('SUMMARY:Hei\\, du\\; test\\\\ok')
    expect(ics).toContain('LOCATION:Bakklandet\\, Trondheim\\; Brygge\\\\A')
    expect(ics).toContain('DESCRIPTION:Linje 1\\,\\nLinje\\;2\\\\3\\n\\nhttps://tebonsma.no/feed/evt-1')
  })

  it('folds iCalendar lines on byte boundaries with multibyte norwegian characters', () => {
    const post = makePost({
      body: `Beskrivelse med norsk tekst ${'æøå'.repeat(20)}`,
      event: { ...makePost().event, location: `Norge ${'æøå'.repeat(20)}` },
    })

    const ics = toIcs([post])
    const encoder = new TextEncoder()
    const lines = ics.trimEnd().split('\r\n')

    expect(lines.some(line => line.startsWith(' '))).toBe(true)
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
    }
  })

  it('encodes google calendar url fields for long details and location', () => {
    const longBody = `Detaljer ${'æøå '.repeat(260)}`
    const location = 'Kjøpmannsgata 1, Trondheim; Norge \\ Bakgård'
    const post = makePost({
      id: 'long-desc',
      body: longBody,
      event: { ...makePost().event, location },
    })

    const urlString = googleCalendarUrl(post)!
    const url = new URL(urlString)
    const details = url.searchParams.get('details')!

    expect(url.searchParams.get('location')).toBe(location)
    expect(details).toContain('https://tebonsma.no/feed/long-desc')
    expect(details).toContain('…')
    expect(details.length).toBeGreaterThan(1000)
    expect(urlString).toContain('%')
  })
})
