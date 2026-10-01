import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { nb } from 'date-fns/locale'
import { eventLink, formatEventDate, getEventStatus, isOnDay, statusDotClass, type EventPost } from '../../lib/events'

const dayHeading = new Intl.DateTimeFormat('nb', { weekday: 'long', day: 'numeric', month: 'long' })

// A month at a time, with the days something happens marked. Picking a day lists its events.
const EventCalendar = ({ events }: { events: EventPost[] }) => {
  const [selected, setSelected] = useState<Date>(new Date())
  const onDay = events.filter(post => isOnDay(post.event, selected))

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <DayPicker
        mode="single"
        required
        locale={nb}
        selected={selected}
        onSelect={setSelected}
        showOutsideDays
        modifiers={{ event: day => events.some(post => isOnDay(post.event, day)) }}
        modifiersClassNames={{ event: '[&>button]:border-teb-orange/60 [&>button]:bg-teb-orange/15 [&>button]:text-white' }}
        className="w-full text-white"
        classNames={{
          months: 'relative',
          month: 'space-y-4',
          month_caption: 'flex items-center justify-center h-10',
          caption_label: 'text-lg font-semibold text-white capitalize',
          nav: 'flex items-center justify-between absolute inset-x-0 top-0 h-10',
          button_previous: 'p-2 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer',
          button_next: 'p-2 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer',
          chevron: 'w-5 h-5 fill-current',
          month_grid: 'w-full border-collapse mt-4',
          weekday: 'font-mono text-xs uppercase tracking-wider text-white/40 font-normal pb-3',
          day: 'p-1 text-center',
          day_button:
            'w-full aspect-square max-w-12 rounded-lg text-sm font-medium mx-auto flex items-center justify-center border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-white/30 cursor-pointer',
          outside: '[&>button]:text-white/25 [&>button]:bg-transparent [&>button]:border-transparent',
          today: '[&>button]:font-bold [&>button]:text-teb-orange',
          selected: '[&>button]:ring-2 [&>button]:ring-teb-orange',
        }}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white first-letter:uppercase">{dayHeading.format(selected)}</h3>
        {onDay.length === 0 && <p className="text-sm text-white/50">Ingen arrangementer denne dagen.</p>}
        <ul className="space-y-2">
          {onDay.map(post => (
            <li key={post.id}>
              <Link
                to={eventLink(post.id)}
                className="block rounded-md border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:border-white/30"
              >
                <span className="flex items-center gap-2 font-medium text-white">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass[getEventStatus(post.event.startsAt, post.event.endsAt)]}`} />
                  <span className="truncate">{post.event.title}</span>
                </span>
                <span className="block text-xs text-white/50">{formatEventDate(post.event.startsAt, post.event.endsAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default EventCalendar
