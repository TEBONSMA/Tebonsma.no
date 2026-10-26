import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Avatar from '../components/Avatar'
import { BUTTON_DANGER, BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT } from '../components/feed/styles'
import ChangeView from '../components/vedtekter/ChangeView'
import StatusBadge from '../components/vedtekter/StatusBadge'
import VedtekterLayout from '../components/vedtekter/VedtekterLayout'
import { showChange } from '../components/vedtekter/changes'
import { useVedtekter } from '../components/vedtekter/useVedtekter'
import { errorMessage, formatDate, timeAgo } from '../lib/feed'
import {
  addComment,
  getForslag,
  setForslagStatus,
  submitForslag,
  withdrawForslag,
  type Forslag as Proposal,
} from '../lib/vedtekter'

const LABEL = 'text-xs font-semibold uppercase tracking-wider text-white/50'

function Detail({ token, number }: { token: string; number: number }) {
  const { document } = useVedtekter(token)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [comment, setComment] = useState('')

  useEffect(() => {
    let active = true
    getForslag(token, number)
      .then(loaded => active && setProposal(loaded))
      .catch(err => active && setError(errorMessage(err)))
    return () => {
      active = false
    }
  }, [token, number])

  const act = async (action: () => Promise<Proposal>) => {
    setBusy(true)
    setActionError(null)
    try {
      setProposal(await action())
      return true
    } catch (err) {
      setActionError(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const sendComment = async (event: FormEvent) => {
    event.preventDefault()
    if (await act(() => addComment(token, number, comment))) setComment('')
  }

  if (error) return <p className={`${ERROR_TEXT} mt-10 text-center`}>{error}</p>
  if (!proposal) return <p className="mt-10 text-center text-sm text-white/60">Henter forslaget …</p>
  const { can } = proposal

  return (
    <div className="mx-auto mt-5 md:mt-8 max-w-3xl space-y-6">
      <Link to="/vedtekter/forslag" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
        <ChevronLeft size={16} aria-hidden="true" />
        Alle forslag
      </Link>

      <header className={`${CARD} p-5`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/50">
              Forslag {proposal.number}
              {proposal.parent && (
                <>
                  {' · '}motforslag til{' '}
                  <Link to={`/vedtekter/forslag/${proposal.parent}`} className="text-teb-orange hover:underline">
                    forslag {proposal.parent}
                  </Link>
                </>
              )}
              {proposal.withdrawnParent && (
                <>
                  {' · '}var motforslag til{' '}
                  <Link to={`/vedtekter/forslag/${proposal.withdrawnParent}`} className="text-teb-orange hover:underline">
                    forslag {proposal.withdrawnParent}
                  </Link>
                  , som er trukket
                </>
              )}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{proposal.title}</h2>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <Avatar name={proposal.author.name} path={proposal.author.avatar} className="h-6 w-6 text-[10px]" />
            {proposal.author.name}
          </span>
          <span>Laget {formatDate(proposal.createdAt)}</span>
          {proposal.submittedAt && <span>Sendt inn {formatDate(proposal.submittedAt)}</span>}
          {proposal.decidedAt && <span>Avgjort {formatDate(proposal.decidedAt)}</span>}
          {proposal.late && <span className="text-amber-300">Sendt inn etter fristen; kan bare tas opp hvis 3/4 krever det (§ 3)</span>}
        </div>
        {proposal.reason && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className={LABEL}>Begrunnelse</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{proposal.reason}</p>
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h3 className={LABEL}>Endringer</h3>
        {document ? (
          proposal.changes.map((change, i) => <ChangeView key={i} change={showChange(document, change)} />)
        ) : (
          <p className="text-sm text-white/60">Henter vedtektene …</p>
        )}
      </section>

      {(can.edit || can.submit || can.withdraw || can.amend || can.decide) && (
        <section className="flex flex-wrap gap-2">
          {can.submit && (
            <button type="button" className={BUTTON_PRIMARY} disabled={busy} onClick={() => void act(() => submitForslag(token, number))}>
              Send inn
            </button>
          )}
          {can.edit && (
            <Link to={`/vedtekter/forslag/${number}/rediger`} className={BUTTON_GHOST}>
              Rediger
            </Link>
          )}
          {can.amend && (
            <Link to={`/vedtekter/forslag/ny?motforslag=${number}`} className={BUTTON_GHOST}>
              Lag motforslag
            </Link>
          )}
          {can.withdraw && (
            <button
              type="button"
              className={BUTTON_DANGER}
              disabled={busy}
              onClick={() => window.confirm('Trekke forslaget?') && void act(() => withdrawForslag(token, number))}
            >
              Trekk forslaget
            </button>
          )}
          {can.decide && (
            <span className="flex flex-wrap items-center gap-2 border-l border-white/10 pl-3">
              <span className="text-xs text-white/50">Protokollfører:</span>
              {proposal.status !== 'vedtatt' && (
                <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => void act(() => setForslagStatus(token, number, 'vedtatt'))}>
                  Vedtatt
                </button>
              )}
              {proposal.status !== 'forkastet' && (
                <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => void act(() => setForslagStatus(token, number, 'forkastet'))}>
                  Forkastet
                </button>
              )}
              {proposal.status !== 'innsendt' && (
                <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => void act(() => setForslagStatus(token, number, 'innsendt'))}>
                  Tilbake til innsendt
                </button>
              )}
            </span>
          )}
        </section>
      )}
      {actionError && <p className={ERROR_TEXT}>{actionError}</p>}

      {proposal.amendments.length > 0 && (
        <section className="space-y-2">
          <h3 className={LABEL}>Motforslag</h3>
          <ul className="space-y-2">
            {proposal.amendments.map(amendment => (
              <li key={amendment.number} className={`${CARD} flex items-center gap-3 p-3 text-sm`}>
                <Link to={`/vedtekter/forslag/${amendment.number}`} className="min-w-0 flex-1 truncate text-white hover:underline">
                  Forslag {amendment.number}: {amendment.title}
                </Link>
                {amendment.withdrawnParent && <span className="text-xs text-white/50">Står nå som eget forslag</span>}
                <span className="text-white/50">{amendment.author.name}</span>
                <StatusBadge status={amendment.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h3 className={LABEL}>Kommentarer</h3>
        {proposal.comments.length === 0 && <p className="text-sm text-white/50">Ingen kommentarer ennå.</p>}
        <ul className="space-y-3">
          {proposal.comments.map(item => (
            <li key={item.id} className="flex gap-3">
              <Avatar name={item.author.name} path={item.author.avatar} className="h-8 w-8 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-white">{item.author.name}</span>{' '}
                  <span className="text-white/40">{timeAgo(item.createdAt)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/80">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <form className="space-y-2" onSubmit={event => void sendComment(event)}>
          <textarea
            className={`${INPUT} min-h-20`}
            value={comment}
            maxLength={2000}
            onChange={event => setComment(event.target.value)}
            placeholder="Skriv en kommentar"
            aria-label="Kommentar"
          />
          <button type="submit" className={BUTTON_GHOST} disabled={busy || !comment.trim()}>
            Kommenter
          </button>
        </form>
      </section>
    </div>
  )
}

// One proposal: its changes as they would turn out, its amendments and what members say about it
export default function Forslag() {
  const number = Number(useParams().number)
  return <VedtekterLayout tab="forslag">{token => <Detail key={number} token={token} number={number} />}</VedtekterLayout>
}
