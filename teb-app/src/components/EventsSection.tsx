import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getEventStatus } from '../lib/events'
import SectionHeader from './SectionHeader'
import EventCard from './EventCard'
import { useEvents } from './events/useEvents'

const SHOWN = 6

// What is on now and what is coming, for the front page. Visitors only get the public
// events, and nothing is shown when there are none.
const EventsSection = () => {
  const { events } = useEvents()
  const ahead = events?.filter(post => getEventStatus(post.event.startsAt, post.event.endsAt) !== 'past').slice(0, SHOWN) ?? []
  if (ahead.length === 0) return null

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <SectionHeader
        eyebrow="Kalender"
        title="Eventer og Hendelser"
        subtitle="Få med deg våre morsomheter!"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ahead.map((post) => (
          <EventCard key={post.id} post={post} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/kalender"
          className="inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40 transition-colors"
        >
          Se kalenderen
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export default EventsSection
