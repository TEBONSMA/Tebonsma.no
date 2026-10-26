import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT } from '../components/feed/styles'
import StatusBadge from '../components/vedtekter/StatusBadge'
import VedtekterLayout from '../components/vedtekter/VedtekterLayout'
import { summaryText } from '../components/vedtekter/changes'
import { errorMessage, timeAgo } from '../lib/feed'
import { listForslag, setArsmote, type Arsmote, type ForslagList, type ForslagSummary, type Status } from '../lib/vedtekter'

const longTime = (iso: string) => new Date(iso).toLocaleString('nb', { dateStyle: 'long', timeStyle: 'short' })

// For <input type="datetime-local">, in local time
const localInput = (iso: string) => {
  const time = new Date(iso)
  return new Date(time.getTime() - time.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

const GROUPS: { title: string; statuses: Status[]; hint?: string }[] = [
  { title: 'Sendt inn', statuses: ['innsendt'], hint: 'Behandles på årsmøtet.' },
  { title: 'Utkast', statuses: ['utkast'], hint: 'Ikke sendt inn ennå. Alle medlemmer kan se dem.' },
  { title: 'Avgjort', statuses: ['vedtatt', 'forkastet'] },
  { title: 'Trukket', statuses: ['trukket'] },
]

function Row({ proposal, amendments }: { proposal: ForslagSummary; amendments: ForslagSummary[] }) {
  return (
    <li className={`${CARD} p-4`}>
      <Link to={`/vedtekter/forslag/${proposal.number}`} className="group block">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/50">Forslag {proposal.number}</p>
            <p className="font-semibold text-white group-hover:underline">{proposal.title}</p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
        <ul className="mt-2 space-y-0.5 text-sm text-white/60">
          {proposal.changes.map((change, i) => (
            <li key={i}>{summaryText(change)}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <Avatar name={proposal.author.name} path={proposal.author.avatar} className="h-5 w-5 text-[9px]" />
            {proposal.author.name}
          </span>
          <span>{timeAgo(proposal.submittedAt ?? proposal.createdAt)}</span>
          {proposal.late && <span className="text-amber-300">Sendt inn etter fristen</span>}
          {proposal.withdrawnParent && <span>Var motforslag til forslag {proposal.withdrawnParent}, som er trukket</span>}
          {proposal.comments > 0 && <span>{proposal.comments} kommentarer</span>}
        </div>
      </Link>
      {amendments.length > 0 && (
        <ul className="mt-3 space-y-1 border-l border-white/10 pl-3">
          {amendments.map(amendment => (
            <li key={amendment.number} className="flex items-center gap-2 text-sm">
              <Link to={`/vedtekter/forslag/${amendment.number}`} className="min-w-0 flex-1 truncate text-white/80 hover:underline">
                Motforslag {amendment.number}: {amendment.title}
              </Link>
              <StatusBadge status={amendment.status} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// The next årsmøte and the deadlines in § 3; the protocol group sets it
function ArsmoteBox({ token, list, onChanged }: { token: string; list: ForslagList; onChanged: (meeting: Arsmote | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(list.arsmote?.title ?? `Ordinært årsmøte ${new Date().getFullYear()}`)
  const [startsAt, setStartsAt] = useState(list.arsmote ? localInput(list.arsmote.startsAt) : '')
  const [error, setError] = useState<string | null>(null)
  const meeting = list.arsmote

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      onChanged(await setArsmote(token, title, new Date(startsAt).toISOString()))
      setEditing(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <section className={`${CARD} p-4 text-sm`}>
      {meeting ? (
        <>
          <p className="font-semibold text-white">
            {meeting.title}, {longTime(meeting.startsAt)}
          </p>
          <p className="mt-1 text-white/60">
            Frist for forslag: {longTime(meeting.forslagFrist)}. Sakslisten skal være klar {longTime(meeting.sakslisteFrist)}.
          </p>
        </>
      ) : (
        <p className="text-white/60">Neste årsmøte er ikke satt ennå. Forslag til endringer må være sendt inn senest én uke før (§ 3).</p>
      )}
      {list.canManage &&
        (editing ? (
          <form className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={event => void save(event)}>
            <input className={INPUT} value={title} onChange={event => setTitle(event.target.value)} aria-label="Navn på årsmøtet" maxLength={100} />
            <input className={INPUT} type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} aria-label="Når" required />
            <button type="submit" className={BUTTON_PRIMARY}>
              Lagre
            </button>
            {error && <p className={`${ERROR_TEXT} sm:col-span-3`}>{error}</p>}
          </form>
        ) : (
          <button type="button" className={`${BUTTON_GHOST} mt-3`} onClick={() => setEditing(true)}>
            {meeting ? 'Endre årsmøtet' : 'Sett neste årsmøte'}
          </button>
        ))}
    </section>
  )
}

function List({ token }: { token: string }) {
  const [list, setList] = useState<ForslagList | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listForslag(token)
      .then(loaded => active && setList(loaded))
      .catch(err => active && setError(errorMessage(err)))
    return () => {
      active = false
    }
  }, [token])

  if (error) return <p className={`${ERROR_TEXT} mt-10 text-center`}>{error}</p>
  if (!list) return <p className="mt-10 text-center text-sm text-white/60">Henter forslagene …</p>

  // Amendments go under the proposal they change
  const amendmentsOf = (number: number) => list.forslag.filter(proposal => proposal.parent === number)
  const proposals = list.forslag.filter(proposal => proposal.parent === null)

  return (
    <div className="mx-auto mt-5 md:mt-8 max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-white/60">
          Alle medlemmer kan foreslå endringer i vedtektene. Årsmøtet behandler forslagene som er sendt inn, og endrer vedtektene med 2/3 flertall.
        </p>
        <Link to="/vedtekter/forslag/ny" className={BUTTON_PRIMARY}>
          Nytt forslag
        </Link>
      </div>

      <ArsmoteBox token={token} list={list} onChanged={arsmote => setList({ ...list, arsmote })} />

      {GROUPS.map(group => {
        const rows = proposals.filter(proposal => group.statuses.includes(proposal.status))
        if (rows.length === 0) return null
        return (
          <section key={group.title} className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                {group.title} <span className="text-white/40">{rows.length}</span>
              </h2>
              {group.hint && <p className="text-sm text-white/50">{group.hint}</p>}
            </div>
            <ul className="space-y-3">
              {rows.map(proposal => (
                <Row key={proposal.number} proposal={proposal} amendments={amendmentsOf(proposal.number)} />
              ))}
            </ul>
          </section>
        )
      })}
      {proposals.length === 0 && <p className="text-center text-sm text-white/60">Ingen forslag ennå.</p>}
    </div>
  )
}

// The proposals to change the vedtekter, grouped by where they are
export default function VedtektForslag() {
  return <VedtekterLayout tab="forslag">{token => <List token={token} />}</VedtekterLayout>
}
