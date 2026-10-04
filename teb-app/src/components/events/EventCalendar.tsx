import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DayButton, DayPicker, type DayButtonProps } from 'react-day-picker'
import { nb } from 'date-fns/locale'
import { eventLink, formatEventDate, getEventStatus, isOnDay, statusDotClass, type EventPost } from '../../lib/events'

const dayHeading = new Intl.DateTimeFormat('nb', { weekday: 'long', day: 'numeric', month: 'long' })

// The library's own button, which keeps keyboard focus working, with a dot under the days
// something happens
const EventDayButton = (props: DayButtonProps) => (
  <DayButton {...props}>
    {props.children}
    {props.modifiers.event && (
      <span
        className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${props.modifiers.selected ? 'bg-white' : 'bg-teb-orange'}`}
      />
    )}
  </DayButton>
)

// A month at a time, with the days something happens marked. Picking a day lists its events.
const EventCalendar = ({ events }: { events: EventPost[] }) => {
  const [selected, setSelected] = useState<Date>(new Date())
  const onDay = events.filter(post => isOnDay(post.event, selected))

  return (
    <div className="grid gap-6 md:grid-cols-[20rem_minmax(0,1fr)] md:gap-8">
      <DayPicker
        mode="single"
        required
        locale={nb}
        selected={selected}
        onSelect={setSelected}
        showOutsideDays
        modifiers={{ event: day => events.some(post => isOnDay(post.event, day)) }}
        modifiersClassNames={{ event: '[&>button]:font-semibold' }}
        components={{ DayButton: EventDayButton }}
        className="mx-auto w-full max-w-xs text-white md:mx-0"
        classNames={{
          months: 'relative',
          month: 'space-y-3',
          month_caption: 'flex h-9 items-center justify-center',
          caption_label: 'text-base font-semibold text-white capitalize',
          nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
          button_previous: 'p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer',
          button_next: 'p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer',
          chevron: 'w-5 h-5 fill-current',
          month_grid: 'w-full border-collapse',
          weekday: 'pb-2 font-mono text-[11px] uppercase tracking-wider text-white/40 font-normal',
          day: 'p-0.5 text-center',
          day_button:
            'relative mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-md text-sm text-white/80 transition-colors hover:bg-white/10 cursor-pointer',
          outside: '[&>button]:text-white/25',
          today: '[&>button]:font-bold [&>button]:text-teb-orange',
          selected: '[&>button]:bg-teb-orange [&>button]:text-white! [&>button]:hover:bg-teb-orange-light',
        }}
      />

      <div className="space-y-3 border-t border-white/10 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
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
