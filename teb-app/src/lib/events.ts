export interface EventItem {
  id: number
  title: string
  startDateTime?: string // ISO 8601 format: 'YYYY-MM-DDTHH:mm:ss' - optional for TBA events
  endDateTime?: string   // ISO 8601 format: 'YYYY-MM-DDTHH:mm:ss' - optional for TBA events
  description: string
  image?: string
}

export type EventStatus = 'upcoming' | 'current' | 'past'

// Add new events here — each one renders as its own card, no other wiring needed.
export const events: EventItem[] = [
  {
    id: 1,
    title: 'Pulebord 2025',
    startDateTime: '2025-12-20T12:30:00',
    endDateTime: '2025-12-21T03:00:00',
    description: 'Årets Pulebord er det 4de av sitt slag, og vi gleder oss til en kveld fylt med god mat, drikke og sosialt samvær. Dette blir en forglemmelig aften.',
    image: 'images/events/Pulebord.JPG',
  },
  {
    id: 2,
    title: 'Guttas Nyttårsaften',
    startDateTime: '2025-12-31T18:00:00',
    endDateTime: '2026-01-01T03:00:00',
    description: 'Vi feirer så klart nyttårsaften sammen og ser fram til en kveld fylt med moro, latter og gode minner. Det blir god mat, drikke og selvfølgelig fyrverkeri ved midnatt.',
    image: 'images/events/Nyttaar.jpg',
  },
  {
    id: 3,
    title: 'Sommerfest',
    description: 'Årets sommerfest er jo såklart høydepunktet på året vårt. Vi samles for en dag fylt med sol, moro og gode vibber. Det blir grilling, musikk og masse aktiviteter.',
    image: 'images/events/Sommerfest.png',
  },
]

export const getEventStatus = (startDateTime?: string, endDateTime?: string): EventStatus => {
  if (!startDateTime || !endDateTime) return 'upcoming'

  const now = new Date()
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'current'
  return 'past'
}

export const formatEventDate = (startDateTime?: string, endDateTime?: string): string => {
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

export const getCountdown = (startDateTime?: string): Countdown | null => {
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
      return 'Pågående'
    case 'upcoming':
      return 'Kommende'
    case 'past':
      return 'Avsluttet'
  }
}
