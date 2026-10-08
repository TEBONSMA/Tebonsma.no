import { useEffect, useState } from 'react'
import { CalendarPlus, Download } from 'lucide-react'
import Badge from '../components/Badge'
import EventCard from '../components/EventCard'
import Layout from '../components/Layout'
import SearchBox from '../components/SearchBox'
import EventCalendar from '../components/events/EventCalendar'
import SubscribeCalendar from '../components/events/SubscribeCalendar'
import { useEvents } from '../components/events/useEvents'
import PostEditor from '../components/feed/PostEditor'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD } from '../components/feed/styles'
import { useAuth } from '../auth/AuthContext'
import { canExport, downloadEvents } from '../lib/calendarExport'
import { getEventStatus, matchesSearch, type EventPost } from '../lib/events'

function EventList({ title, events }: { title: string; events: EventPost[] }) {
  if (events.length === 0) return null
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(post => (
          <EventCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}

export default function Kalender() {
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null
  const { events, error, reload } = useEvents()
  const [writing, setWriting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const matching = events?.filter(post => matchesSearch(post, search)) ?? []
  const dated = matching.filter(post => post.event.startsAt)
  const exportable = (events ?? []).filter(post => post.event.startsAt).filter(canExport)
  const isPast = (post: EventPost) => getEventStatus(post.event.startsAt, post.event.endsAt) === 'past'

  return (
    <Layout mainClassName="w-full max-w-5xl mx-auto px-4 pt-24 pb-16 space-y-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge>Kalender</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Arrangementer</h1>
        <p className="text-white/70 max-w-xl">Alt som skjer i TEBONSMA, og alt som har skjedd.</p>
      </div>

      {token ? (
        writing ? (
          <section className={`${CARD} mx-auto max-w-2xl p-4 md:p-5`}>
            <PostEditor
              token={token}
              startAsEvent
              onCancel={() => setWriting(false)}
              onSaved={() => {
                setWriting(false)
                reload()
              }}
            />
          </section>
        ) : (
          <div className="flex justify-center">
            <button type="button" className={BUTTON_PRIMARY} onClick={() => setWriting(true)}>
              <CalendarPlus size={18} aria-hidden="true" />
              Nytt arrangement
            </button>
          </div>
        )
      ) : (
        !isLoading && (
          <section className={`${CARD} mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 p-4 md:p-5`}>
            <p className="text-sm text-white/70">Logg inn for å se lukkede arrangementer og opprette nye.</p>
            <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
              Logg inn
            </button>
          </section>
        )
      )}

      {!events && <p className="py-8 text-center text-white/60">Laster arrangementer…</p>}

      {error && (
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-red-300">{error}</p>
          <button type="button" className={BUTTON_GHOST} onClick={reload}>
            Prøv igjen
          </button>
        </div>
      )}

      {events && !error && (
        <>
          <SearchBox
            id="event-search"
            label="Søk i arrangementer"
            placeholder="Søk etter arrangement, sted eller arrangør…"
            value={search}
            onChange={setSearch}
            className="mx-auto max-w-2xl"
          />

          <section className={`${CARD} p-4 md:p-6`}>
            <EventCalendar events={dated} />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">Abonner, så dukker nye arrangementer opp i din egen kalender.</p>
              <div className="flex flex-wrap items-center gap-2">
                <SubscribeCalendar token={token} />
                {exportable.length > 0 && (
                  <button type="button" className={BUTTON_GHOST} onClick={() => downloadEvents(exportable)}>
                    <Download size={16} aria-hidden="true" />
                    Last ned (.ics)
                  </button>
                )}
              </div>
            </div>
          </section>

          {events.length === 0 && <p className="py-4 text-center text-white/60">Ingen arrangementer ennå.</p>}
          {events.length > 0 && matching.length === 0 && (
            <p className="py-4 text-center text-white/60">Ingen arrangementer matcher «{search.trim()}».</p>
          )}

          <EventList title="Kommende" events={dated.filter(post => !isPast(post))} />
          <EventList title="Dato kommer" events={matching.filter(post => !post.event.startsAt)} />
          {/* The latest first */}
          <EventList title="Tidligere" events={dated.filter(isPast).reverse()} />
        </>
      )}
    </Layout>
  )
}
