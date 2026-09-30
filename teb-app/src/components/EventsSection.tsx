import type { EventItem } from '../lib/events'
import SectionHeader from './SectionHeader'
import EventCard from './EventCard'

interface EventsSectionProps {
  events: EventItem[]
}

const EventsSection = ({ events }: EventsSectionProps) => {
  if (events.length === 0) return null

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <SectionHeader
        eyebrow="Kalender"
        title="Eventer og Hendelser"
        subtitle="Få med deg våre morsomheter!"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

export default EventsSection
