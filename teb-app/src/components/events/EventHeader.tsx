import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, HelpCircle, MapPin, X } from 'lucide-react'
import Avatar from '../Avatar'
import MemberLink from '../MemberLink'
import { cn } from '../../lib/utils'
import {
  eventLink,
  formatCountdown,
  formatEventDate,
  getEventStatus,
  getRsvps,
  getStatusText,
  setRsvp,
  statusDotClass,
} from '../../lib/events'
import { errorMessage, type Answer, type EventDetails, type FeedMember, type Rsvp } from '../../lib/feed'
import { tebbetEventLink } from '../../lib/tebbet'
import { BUTTON_GHOST, ERROR_TEXT } from '../feed/styles'
import AddToCalendar from './AddToCalendar'
import { useCountdown } from './useCountdown'

const ANSWERS = [
  { value: 'yes', label: 'Kommer', Icon: Check },
  { value: 'maybe', label: 'Kommer kanskje', Icon: HelpCircle },
  { value: 'no', label: 'Kommer ikke', Icon: X },
] as const

interface SignUpProps {
  postId: string
  rsvp: Rsvp
  // No more answers once the event is over
  closed: boolean
  token: string
  onChange: (rsvp: Rsvp) => void
}

// Members say whether they are coming, and take the answer back by picking it again
function SignUp({ postId, rsvp, closed, token, onChange }: SignUpProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The members behind the counts, while the list is open
  const [answered, setAnswered] = useState<Record<Answer, FeedMember[]> | null>(null)
  const [open, setOpen] = useState(false)

  const loadAnswered = () =>
    getRsvps(token, postId)
      .then(setAnswered)
      .catch(err => setError(errorMessage(err)))

  const answer = async (value: Answer) => {
    setBusy(true)
    setError(null)
    try {
      onChange(await setRsvp(token, postId, rsvp.mine === value ? null : value))
      if (open) await loadAnswered()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleList = () => {
    setOpen(!open)
    if (!open) {
      setError(null)
      loadAnswered()
    }
  }

  return (
    <div className="space-y-2 border-t border-white/10 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {ANSWERS.map(({ value, label, Icon }) => {
          const mine = rsvp.mine === value
          return (
            <button
              key={value}
              type="button"
              disabled={busy || closed}
              aria-pressed={mine}
              onClick={() => answer(value)}
              className={cn(BUTTON_GHOST, 'px-3 py-1.5', mine && 'border-teb-orange/70 bg-teb-orange/15 text-white hover:border-teb-orange')}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
              <span className="font-mono text-xs text-white/60">{rsvp[value]}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="ml-auto text-xs font-medium text-white/50 cursor-pointer hover:text-white"
          aria-expanded={open}
          onClick={toggleList}
        >
          {open ? 'Skjul påmeldte' : 'Se påmeldte'}
        </button>
      </div>

      {open && answered && (
        <div className="grid gap-3 sm:grid-cols-3">
          {ANSWERS.map(({ value, label }) => (
            <div key={value}>
              <p className="pb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                {label} · {answered[value].length}
              </p>
              {answered[value].length === 0 && <p className="text-sm text-white/40">Ingen ennå</p>}
              <ul className="space-y-1">
                {answered[value].map(member => (
                  <li key={member.id} className="flex items-center gap-2 py-0.5 text-sm text-white/90">
                    <Avatar name={member.name} path={member.avatar} className="h-6 w-6 text-[10px]" />
                    <MemberLink member={member} className="truncate">
                      {member.name}
                    </MemberLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {open && !answered && !error && <p className="text-sm text-white/50">Laster…</p>}
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </div>
  )
}

interface EventHeaderProps {
  postId: string
  // The text of the post, which follows the event into a calendar
  body: string
  event: EventDetails
  token: string | null
  onChange: (event: EventDetails) => void
}

// What a post shows when it is an event: what, when and where, and who is coming
const EventHeader = ({ postId, body, event, token, onChange }: EventHeaderProps) => {
  const status = getEventStatus(event.startsAt, event.endsAt)
  const countdown = useCountdown(status === 'upcoming' ? event.startsAt : null)

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass[status]}`} />
          {getStatusText(status)}
          {countdown && (
            <span className="ml-auto inline-flex items-center gap-1.5 normal-case tracking-normal text-teb-orange">
              <Clock size={14} aria-hidden="true" />
              {formatCountdown(countdown)}
            </span>
          )}
        </p>
        <h3 className="text-xl font-semibold leading-tight text-white">
          <Link to={eventLink(postId)} className="hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="text-sm text-white/70">{formatEventDate(event.startsAt, event.endsAt)}</p>
        {event.location && (
          <p className="flex items-center gap-1.5 text-sm text-white/60">
            <MapPin size={14} aria-hidden="true" className="shrink-0" />
            {event.location}
          </p>
        )}
      </div>

      {event.organizers.length > 0 && (
        <p className="text-sm text-white/60">
          Med arrangører:{' '}
          {event.organizers.map((member, i) => (
            <span key={member.id}>
              {i > 0 && ', '}
              <MemberLink member={member}>{member.name}</MemberLink>
            </span>
          ))}
        </p>
      )}

      {status !== 'past' && <AddToCalendar post={{ id: postId, body, event }} />}

      {event.rsvp && token && (
        <SignUp
          postId={postId}
          rsvp={event.rsvp}
          closed={status === 'past'}
          token={token}
          onChange={rsvp => onChange({ ...event, rsvp })}
        />
      )}

      {token && event.betting && (
        <a href={tebbetEventLink(postId)} className="inline-block text-sm font-medium text-teb-orange hover:underline">
          Spill på arrangementet på TebBet
        </a>
      )}
    </div>
  )
}

export default EventHeader
