import { useEffect, useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import {
  type EventItem,
  type Countdown,
  getEventStatus,
  formatEventDate,
  getCountdown,
  formatCountdown,
  getStatusText,
} from '../lib/events'

const statusDotClass: Record<ReturnType<typeof getEventStatus>, string> = {
  current: 'bg-teb-green',
  upcoming: 'bg-teb-orange',
  past: 'bg-white/30',
}

const EventCard = ({ event }: { event: EventItem }) => {
  const [countdown, setCountdown] = useState<Countdown | null>(null)
  const status = getEventStatus(event.startDateTime, event.endDateTime)
  const formattedDate = formatEventDate(event.startDateTime, event.endDateTime)

  useEffect(() => {
    if (status !== 'upcoming' || !event.startDateTime) return

    const tick = () => setCountdown(getCountdown(event.startDateTime))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [status, event.startDateTime])

  return (
    <article className="flex flex-col border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden hover:border-white/20 transition-colors">
      <div className="w-full aspect-video bg-white/5">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass[status]}`} />
          {getStatusText(status)}
          <span className="text-white/20">·</span>
          <span className="normal-case tracking-normal text-white/40">{formattedDate}</span>
        </div>

        <h3 className="text-xl font-semibold text-white leading-tight">{event.title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{event.description}</p>

        {countdown && (
          <div className="flex items-center gap-2 mt-1 font-mono text-xs text-teb-orange">
            <Clock className="w-3.5 h-3.5" />
            {formatCountdown(countdown)}
          </div>
        )}
      </div>
    </article>
  )
}

export default EventCard
