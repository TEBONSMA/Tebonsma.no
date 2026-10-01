import { Link } from 'react-router-dom'
import { Calendar, Clock, Lock, MapPin, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  eventLink,
  formatCountdown,
  formatEventDate,
  getEventStatus,
  getStatusText,
  statusDotClass,
  type EventPost,
} from '../lib/events'
import type { Attachment, Visibility } from '../lib/feed'
import { useImageSrc } from './feed/useImageSrc'
import { useCountdown } from './events/useCountdown'

function Cover({ picture, visibility, title }: { picture: Attachment; visibility: Visibility; title: string }) {
  const { user } = useAuth()
  const src = useImageSrc(picture, visibility, user?.access_token ?? null)
  if (!src) return <div className="w-full h-full animate-pulse bg-white/5" />
  return <img src={src} alt={title} loading="lazy" className="w-full h-full object-cover" />
}

const EventCard = ({ post }: { post: EventPost }) => {
  const { event } = post
  const status = getEventStatus(event.startsAt, event.endsAt)
  const formattedDate = formatEventDate(event.startsAt, event.endsAt)
  const countdown = useCountdown(status === 'upcoming' ? event.startsAt : null)
  const picture = post.attachments.find(attachment => attachment.isImage)

  return (
    <Link
      to={eventLink(post.id)}
      className="flex flex-col border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden hover:border-white/20 transition-colors"
    >
      <article className="flex flex-1 flex-col">
        <div className="w-full aspect-video bg-white/5">
          {picture ? (
            <Cover picture={picture} visibility={post.visibility} title={event.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white/20" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass[status]}`} />
            {getStatusText(status)}
            <span className="text-white/20">·</span>
            <span className="normal-case tracking-normal text-white/40">{formattedDate}</span>
          </div>

          <h3 className="text-xl font-semibold text-white leading-tight">{event.title}</h3>
          {post.body && <p className="text-sm text-white/60 leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">{post.body}</p>}

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-white/50">
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
            {post.visibility === 'members' && (
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Lukket
              </span>
            )}
            {event.rsvp && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {event.rsvp.yes} kommer
              </span>
            )}
          </div>

          {countdown && (
            <div className="flex items-center gap-2 font-mono text-xs text-teb-orange">
              <Clock className="w-3.5 h-3.5" />
              {formatCountdown(countdown)}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

export default EventCard
