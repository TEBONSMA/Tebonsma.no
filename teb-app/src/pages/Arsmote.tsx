import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Avatar from '../components/Avatar'
import { BUTTON_DANGER, BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT, SELECT } from '../components/feed/styles'
import StatusBadge from '../components/vedtekter/StatusBadge'
import VedtekterLayout from '../components/vedtekter/VedtekterLayout'
import ArsmoteForm from '../components/vedtekter/ArsmoteForm'
import ChangeView from '../components/vedtekter/ChangeView'
import { placements, showChange, summaryText, type ChangeShown } from '../components/vedtekter/changes'
import { useVedtekter } from '../components/vedtekter/useVedtekter'
import { errorMessage, listMembers, type FeedMember } from '../lib/feed'
import {
  ADOPT_WORKFLOW,
  castVote,
  checkIn,
  checkInMember,
  checkOutMember,
  closeVotering,
  drawLot,
  endArsmote,
  getLive,
  addPunkt,
  openFreeVotering,
  openVotering,
  removePunkt,
  revote,
  setAgenda,
  startArsmote,
  type Change,
  type Choice,
  type ForslagSummary,
  type Live,
  type Sak,
  type Vedtekter,
  type Votering,
} from '../lib/vedtekter'

const LABEL = 'text-xs font-semibold uppercase tracking-wider text-white/50'
const MOVE = 'rounded p-0.5 text-white/50 cursor-pointer hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent'
// How often the page asks for news while it is open
const POLL_MS = 3000

const longTime = (iso: string) => new Date(iso).toLocaleString('nb', { dateStyle: 'long', timeStyle: 'short' })

const name = (proposal: ForslagSummary) => `Forslag ${proposal.number}`

function Changes({ proposal }: { proposal: ForslagSummary }) {
  return (
    <ul className="mt-1 space-y-0.5 text-sm text-white/60">
      {proposal.changes.map((change, i) => (
        <li key={i}>{summaryText(change)}</li>
      ))}
    </ul>
  )
}

// A proposal being voted on, with its changes in full against the vedtekter as they are
function Proposal({ proposal, changes, document }: { proposal: ForslagSummary; changes: Change[] | null; document: Vedtekter | null }) {
  return (
    <div className="mt-4">
      <p className="text-xs text-white/50">
        {name(proposal)}
        {proposal.parent && `, motforslag til forslag ${proposal.parent}`}
      </p>
      <Link to={`/vedtekter/forslag/${proposal.number}`} className="font-semibold text-white hover:underline">
        {proposal.title}
      </Link>
      {document && changes ? (
        <div className="mt-2 space-y-2">
          {changes.map((change, i) => (
            <ChangeView key={i} change={showChange(document, change, placements(document, changes)[i])} />
          ))}
        </div>
      ) : (
        <Changes proposal={proposal} />
      )}
    </div>
  )
}

// When two proposals each write one paragraph, what the second writes differently from the first
function difference(vote: Votering): ChangeShown | null {
  const [a, b] = [vote.changes?.a, vote.changes?.b]
  if (a?.length !== 1 || b?.length !== 1 || a[0].type === 'slette' || b[0].type === 'slette') return null
  return {
    heading: `Forskjellen fra ${vote.options[0].toLowerCase()} til ${vote.options[1].toLowerCase()}`,
    before: { title: a[0].title, text: a[0].text },
    after: { title: b[0].title, text: b[0].text },
  }
}

// One of the choices in a vote, big enough to hit with a thumb
function Option({
  label,
  detail,
  chosen,
  disabled,
  onChoose,
}: {
  label: string
  detail?: ReactNode
  chosen: boolean
  disabled: boolean
  onChoose: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      disabled={disabled}
      onClick={onChoose}
      className={`w-full rounded-lg border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed ${
        chosen ? 'border-teb-orange bg-teb-orange/15' : 'border-white/10 bg-white/[0.03] enabled:hover:border-white/25'
      } ${disabled && !chosen ? 'opacity-60' : ''}`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-lg font-semibold text-white">{label}</span>
        {chosen && <span className="shrink-0 text-xs font-semibold text-teb-orange-light">Din stemme</span>}
      </span>
      {detail}
    </button>
  )
}

// "Gjenvalg: Valg av styre" for a vote again after a tie
const titleOf = (vote: Votering) => (vote.gjenvalgAv ? `Gjenvalg: ${vote.title}` : vote.title)

const KIND: Record<Votering['kind'], string> = { kontra: 'Kontravotering', endelig: 'Endelig votering', opptak: 'Opptak av forslag', fri: 'Avstemning' }

// Under each option: what choosing it means
function optionDetail(vote: Votering, i: number) {
  if (vote.kind === 'endelig') return i === 0 ? `Vedta ${vote.options[0].toLowerCase()}` : 'Behold vedtektene slik de er'
  if (vote.kind === 'kontra') return [vote.a, vote.b][i]?.title
  if (vote.kind === 'opptak') return i === 0 ? 'Behandle forslaget på dette årsmøtet' : 'Vent til neste årsmøte'
  return undefined
}

function OpenVote({
  vote,
  document,
  present,
  busy,
  onVote,
}: {
  vote: Votering
  document: Vedtekter | null
  present: boolean
  busy: boolean
  onVote: (choice: Choice) => void
}) {
  const disabled = !present || busy
  const differs = difference(vote)
  return (
    <section className={`${CARD} border-teb-orange/40 p-4 sm:p-5`} aria-live="polite">
      <p className={LABEL}>{KIND[vote.kind]} pågår</p>
      <h2 className="mt-1 text-xl font-bold text-white">{titleOf(vote)}</h2>
      <p className="mt-1 text-sm text-white/60">{vote.required}</p>
      {vote.a && <Proposal proposal={vote.a} changes={vote.changes?.a ?? null} document={document} />}
      {vote.b && <Proposal proposal={vote.b} changes={vote.changes?.b ?? null} document={document} />}
      {differs && (
        <div className="mt-4">
          <ChangeView change={differs} />
        </div>
      )}

      <div className="mt-5 space-y-2">
        {vote.options.map((label, i) => {
          const detail = optionDetail(vote, i)
          return (
            <Option
              key={i}
              label={label}
              detail={detail && <span className="mt-0.5 block text-sm text-white/60">{detail}</span>}
              chosen={vote.mine === i}
              disabled={disabled}
              onChoose={() => onVote(i)}
            />
          )
        })}
        <Option label="Blankt" chosen={vote.mine === 'blank'} disabled={disabled} onChoose={() => onVote('blank')} />
      </div>

      <p className="mt-3 text-sm text-white/60">
        {!present
          ? 'Sjekk inn på årsmøtet for å stemme.'
          : vote.mine !== null
            ? 'Du kan endre stemmen til voteringen lukkes.'
            : 'Trykk på det du stemmer.'}{' '}
        {vote.voted} har stemt på mobil.
      </p>
    </section>
  )
}

// "5 mot 3, 1 blank", "6 for, 1 mot", "Kari 2, Ola 3"
const tally = (vote: Votering) => {
  if (!vote.counts) return ''
  const { total, blank } = vote.counts
  const blanks = blank.total ? `, ${blank.total} ${blank.total === 1 ? 'blank' : 'blanke'}` : ''
  if (vote.kind === 'endelig') return `${total[0]} for, ${total[1]} mot${blanks}`
  if (vote.kind === 'kontra') return `${total[0]} mot ${total[1]}${blanks}`
  if (vote.kind === 'opptak') return `${total[0]} ja, ${total[1]} nei${blanks}, ${vote.present} til stede`
  return vote.options.map((option, i) => `${option} ${total[i]}`).join(', ') + blanks
}

// "Kari og Ola"
const names = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} og ${items[items.length - 1]}`)

function outcome(vote: Votering) {
  const won = vote.result === null ? null : vote.options[vote.result]
  if (vote.gjenvalg) return `Likt mellom ${names((vote.tied ?? []).map(i => vote.options[i].replace(/^Forslag/, 'forslag')))}, så det ble gjenvalg. ${tally(vote)}.`
  if (vote.kind === 'endelig') return `${vote.a?.title}: ${vote.result === 0 ? 'vedtatt' : 'ikke vedtatt'} med ${tally(vote)}.`
  if (vote.kind === 'kontra') return `${won} gikk videre, ${vote.options[1 - (vote.result ?? 0)].toLowerCase()} falt. ${tally(vote)}.`
  if (vote.kind === 'opptak') {
    return `Forslag ${vote.a?.number} ${vote.result === 0 ? 'tas opp' : 'tas ikke opp, og går videre til neste årsmøte'}. ${tally(vote)}.`
  }
  if (won === null) return `${vote.rule === 'to-tredjedeler' ? 'Ingen fikk 2/3 av stemmene' : 'Ingen stemmer'}. ${tally(vote)}.`
  return `Resultat: ${won}. ${tally(vote)}.`
}

const winnerOf = (vote: Votering) => (vote.result === null ? '' : vote.options[vote.result].replace(/^Forslag/, 'forslag'))

function Result({ vote }: { vote: Votering }) {
  return (
    <li className={`${CARD} p-4`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/50">{KIND[vote.kind]}</p>
          <p className="font-semibold text-white">{titleOf(vote)}</p>
        </div>
        {vote.kind === 'endelig' && <StatusBadge status={vote.result === 0 ? 'vedtatt' : 'forkastet'} />}
      </div>
      <p className="mt-1 text-sm text-white/70">
        {outcome(vote)}
        {vote.byLot && ` Likt; ${winnerOf(vote)} vant loddtrekningen.`}
      </p>
    </li>
  )
}

// A tie, for everyone to see while the protocol group decides it
function TieCard({ vote }: { vote: Votering }) {
  return (
    <section className={`${CARD} border-amber-400/40 p-4 sm:p-5`} aria-live="polite">
      <p className={LABEL}>Likt</p>
      <h2 className="mt-1 text-xl font-bold text-white">{titleOf(vote)}</h2>
      <p className="mt-1 text-sm text-white/70">{tally(vote)}.</p>
      <p className="mt-2 text-sm text-white/60">Protokollføreren avgjør det med gjenvalg eller loddtrekning (§ 3).</p>
    </section>
  )
}

// After a tie: vote again, without the options left out, or put in the lot drawn in the room
function TieDecision({
  vote,
  busy,
  onLot,
  onRevote,
}: {
  vote: Votering
  busy: boolean
  onLot: (option: number | 'tilfeldig') => void
  onRevote: (keep: number[]) => void
}) {
  const tied = vote.tied ?? []
  // Those with the most votes stay; the others are left out unless ticked
  const [keep, setKeep] = useState<number[]>(tied)
  const total = vote.counts?.total ?? []
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70">
        Likt: {titleOf(vote)}. {tally(vote)}.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Gjenvalg</h3>
        {vote.kind === 'fri' ? (
          <>
            <p className="text-sm text-white/60">Det stemmes på nytt over alternativene med hake.</p>
            <ul className="space-y-1">
              {vote.options.map((option, i) => (
                <li key={i}>
                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      className="accent-teb-orange"
                      checked={keep.includes(i)}
                      onChange={event => setKeep(event.target.checked ? [...keep, i] : keep.filter(j => j !== i))}
                    />
                    <span className="min-w-0 flex-1">{option}</span>
                    <span className="tabular-nums text-white/50">{total[i]}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-white/60">Det stemmes på nytt mellom de to forslagene.</p>
        )}
        <button
          type="button"
          className={BUTTON_GHOST}
          disabled={busy || (vote.kind === 'fri' && keep.length < 2)}
          onClick={() => onRevote(vote.kind === 'fri' ? keep : [0, 1])}
        >
          Start gjenvalg
        </button>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Loddtrekning</h3>
        <p className="text-sm text-white/60">Trekk lodd i salen og legg inn hvem som vant, eller la nettsiden trekke.</p>
        <div className="flex flex-wrap gap-2">
          {tied.map(i => (
            <button
              key={i}
              type="button"
              className={BUTTON_GHOST}
              disabled={busy}
              onClick={() => window.confirm(`${vote.options[i]} vant loddtrekningen?`) && onLot(i)}
            >
              {vote.options[i]} vant
            </button>
          ))}
          <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => window.confirm('La nettsiden trekke lodd?') && onLot('tilfeldig')}>
            La nettsiden trekke
          </button>
        </div>
      </div>
    </div>
  )
}

const HAND_INPUT = INPUT.replace('w-full', 'w-20')
const handNumber = (value: string) => Math.max(0, Math.min(1000, Math.floor(Number(value) || 0)))

// The protocol group closes a vote with what was counted by hand in the room
function CloseVote({ vote, busy, onClose }: { vote: Votering; busy: boolean; onClose: (hand: { options: number[]; blank: number }) => void }) {
  const [hand, setHand] = useState<string[]>(() => [...vote.options.map(() => ''), ''])
  const counted = hand.map(handNumber)
  const phone = [...(vote.counts?.phone ?? vote.options.map(() => 0)), vote.counts?.blank.phone ?? 0]
  const labels = [...vote.options, 'Blanke']
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">Åpen: {vote.title}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-white/50">
            <th className="py-1 font-medium" />
            <th className="px-2 py-1 text-right font-medium">Mobil</th>
            <th className="px-2 py-1 font-medium">I salen</th>
            <th className="py-1 text-right font-medium">Sum</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={i} className="border-t border-white/10">
              <th scope="row" className="py-2 pr-2 text-left font-medium text-white/80">
                {label}
              </th>
              <td className="px-2 py-2 text-right tabular-nums text-white/80">{phone[i]}</td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  aria-label={`${label}, opptalt i salen`}
                  className={HAND_INPUT}
                  value={hand[i]}
                  onChange={event => setHand(hand.map((value, j) => (j === i ? event.target.value : value)))}
                  placeholder="0"
                />
              </td>
              <td className="py-2 text-right font-semibold tabular-nums text-white">{phone[i] + counted[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className={BUTTON_PRIMARY}
        disabled={busy}
        onClick={() =>
          window.confirm('Lukke voteringen? Resultatet kan ikke endres etterpå.') && onClose({ options: counted.slice(0, -1), blank: counted[counted.length - 1] })
        }
      >
        Lukk voteringen
      </button>
    </div>
  )
}

// Anything else on the agenda, like an election or the budget, with its own options
function FreeVote({
  sak,
  busy,
  onOpen,
}: {
  sak: Sak | null
  busy: boolean
  onOpen: (title: string, options: string[], rule: Votering['rule'], sak: string | null) => void
}) {
  const [title, setTitle] = useState(sak?.title ?? '')
  const [options, setOptions] = useState(['Ja', 'Nei'])
  // Set up from a case further down the agenda: bring it into view
  const form = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    if (sak) form.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [sak])
  const [rule, setRule] = useState<Votering['rule']>('flertall')
  const filled = options.map(option => option.trim()).filter(Boolean)
  return (
    <details open={!!sak} ref={form}>
      <summary className="cursor-pointer text-sm text-white/60 hover:text-white">{sak ? `Avstemning om sak: ${sak.title}` : 'Annen avstemning'}</summary>
      <div className="mt-3 space-y-3">
        <input
          className={INPUT}
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Hva stemmes det over? For eksempel «Valg av styreleder»"
          aria-label="Spørsmål"
          maxLength={140}
        />
        <div className="space-y-2">
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={INPUT}
                value={option}
                onChange={event => setOptions(options.map((value, j) => (j === i ? event.target.value : value)))}
                placeholder={`Alternativ ${i + 1}`}
                aria-label={`Alternativ ${i + 1}`}
                maxLength={80}
              />
              {options.length > 2 && (
                <button type="button" className="shrink-0 px-1 text-sm text-white/50 hover:text-red-300" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                  Fjern
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button type="button" className="text-sm text-teb-orange hover:underline" onClick={() => setOptions([...options, ''])}>
              Legg til alternativ
            </button>
          )}
        </div>
        <fieldset className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
          <legend className="sr-only">Krav</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="rule" checked={rule === 'flertall'} onChange={() => setRule('flertall')} className="accent-teb-orange" />
            Flest stemmer
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="rule" checked={rule === 'to-tredjedeler'} onChange={() => setRule('to-tredjedeler')} className="accent-teb-orange" />
            2/3 flertall
          </label>
        </fieldset>
        <button type="button" className={BUTTON_GHOST} disabled={busy || !title.trim() || filled.length < 2} onClick={() => onOpen(title.trim(), filled, rule, sak?.punkt ?? null)}>
          Start avstemningen
        </button>
      </div>
    </details>
  )
}

const OPPTAK = {
  kreves: { label: 'Etter fristen', className: 'border-amber-400/40 text-amber-300' },
  'tatt-opp': { label: 'Tatt opp', className: 'border-white/15 text-white/60' },
  'ikke-tatt-opp': { label: 'Ikke tatt opp', className: 'border-white/10 text-white/40' },
}

// A proposal sent in after the deadline: still to be taken up by 3/4, or taken up or not
function OpptakTag({ opptak }: { opptak: keyof typeof OPPTAK }) {
  const { label, className } = OPPTAK[opptak]
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${className}`}>{label}</span>
}

// "Ferdig", "Nå": where a case on the agenda stands
function SakState({ sak }: { sak: Sak }) {
  if (sak.current) return <span className="shrink-0 text-xs font-semibold text-teb-orange-light">Nå</span>
  if (sak.done) return <span className="shrink-0 text-xs text-white/40">Ferdig</span>
  return null
}

// What a proposal is: against another proposal, or else what it does to the vedtekter
function kindOf(proposal: ForslagSummary) {
  if (proposal.parent) return 'motforslag'
  const types = new Set(proposal.changes.map(change => change.type))
  if (types.size === 1 && types.has('legge-til')) return 'tilleggsforslag'
  if (types.size === 1 && types.has('slette')) return 'strykningsforslag'
  return 'endringsforslag'
}

// "Endringsforslag 3 og motforslag 4", "Tilleggsforslag 7", or the title of another case
function sakLabel(sak: Sak) {
  if (sak.punkt) return sak.title
  const byKind = new Map<string, number[]>()
  for (const proposal of sak.forslag) byKind.set(kindOf(proposal), [...(byKind.get(kindOf(proposal)) ?? []), proposal.number])
  const text = names([...byKind].map(([kind, numbers]) => `${kind} ${names(numbers.map(String))}`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The agenda for everyone, one line a case, folded away until opened
function Saksliste({ saker }: { saker: Sak[] }) {
  const current = saker.findIndex(sak => sak.current)
  return (
    <details className={`${CARD} group px-4 py-3`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-white">Saksliste</span>
        <span className="text-white/50">
          {current >= 0 ? `Sak ${current + 1} av ${saker.length}` : `${saker.length} ${saker.length === 1 ? 'sak' : 'saker'}`}
          <span className="ml-2 inline-block transition-transform group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </span>
      </summary>
      <ol className="mt-2 divide-y divide-white/5 text-sm">
        {saker.map((sak, i) => (
          <li key={sak.key} className={`flex items-baseline gap-2 py-1.5 ${sak.done && !sak.current ? 'text-white/40' : 'text-white/80'}`}>
            <span className="w-5 shrink-0 text-right tabular-nums text-white/40">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate">
              {sakLabel(sak)}
              {sak.forslag.some(proposal => proposal.opptak === 'kreves') && <span className="text-amber-300"> · etter fristen</span>}
            </span>
            <SakState sak={sak} />
          </li>
        ))}
      </ol>
    </details>
  )
}

// The protocol group's agenda: the cases in order, to move up and down, with the next vote in each
function Agenda({
  live,
  busy,
  onOrder,
  onAdd,
  onRemove,
  onOpen,
  onPrepare,
}: {
  live: Live
  busy: boolean
  onOrder: (order: string[]) => void
  onAdd: (title: string) => void
  onRemove: (punkt: string) => void
  onOpen: (a: number, b: number | null, opptak?: boolean) => void
  onPrepare: (sak: Sak) => void
}) {
  const [title, setTitle] = useState('')
  const running = live.arsmote?.state === 'pågår' && live.voteringer.every(vote => vote.status === 'lukket')
  // For a vote set up by hand: those not waiting to be taken up, or left out
  const open = live.saker.flatMap(sak => sak.forslag).filter(proposal => proposal.status === 'innsendt' && (!proposal.opptak || proposal.opptak === 'tatt-opp'))
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const move = (from: number, to: number) => {
    const keys = live.saker.map(sak => sak.key)
    keys.splice(to, 0, keys.splice(from, 1)[0])
    onOrder(keys)
  }
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Saksliste</h3>
      {live.saker.length === 0 && <p className="text-sm text-white/60">Ingen saker ennå.</p>}
      <ol className="space-y-2">
        {live.saker.map((sak, i) => (
          <li key={sak.key} className={`rounded-md border p-3 ${sak.current ? 'border-teb-orange/50' : 'border-white/10'}`}>
            <div className="flex items-start gap-2">
              <span className="pt-0.5 text-xs tabular-nums text-white/50">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                {sak.punkt ? (
                  <p className={`text-sm font-medium ${sak.done ? 'text-white/50' : 'text-white'}`}>{sak.title}</p>
                ) : (
                  <ul className="space-y-1">
                    {sak.forslag.map(proposal => (
                      <li key={proposal.number} className="flex items-center gap-2 text-sm">
                        <Link
                          to={`/vedtekter/forslag/${proposal.number}`}
                          className={`min-w-0 flex-1 truncate hover:underline ${proposal.parent ? 'pl-3 text-white/70' : 'text-white'}`}
                        >
                          {proposal.parent ? 'Motforslag ' : 'Forslag '}
                          {proposal.number}: {proposal.title}
                        </Link>
                        {proposal.opptak && <OpptakTag opptak={proposal.opptak} />}
                        <StatusBadge status={proposal.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 flex-col">
                <button type="button" className={MOVE} disabled={busy || i === 0} onClick={() => move(i, i - 1)} aria-label={`Flytt sak ${i + 1} opp`}>
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={MOVE}
                  disabled={busy || i === live.saker.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`Flytt sak ${i + 1} ned`}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 empty:hidden">
              {running && sak.next && (
                <button type="button" className={`${BUTTON_GHOST} w-full sm:w-auto`} disabled={busy} onClick={() => onOpen(sak.next!.a, sak.next!.b, sak.next!.opptak)}>
                  {sak.next.opptak
                    ? `Start votering: skal forslag ${sak.next.a} tas opp? (3/4)`
                    : `Start votering: forslag ${sak.next.a} mot ${sak.next.b ? `forslag ${sak.next.b}` : 'vedtektene'}`}
                </button>
              )}
              {running && sak.punkt && !sak.done && (
                <button type="button" className={`${BUTTON_GHOST} w-full sm:w-auto`} disabled={busy} onClick={() => onPrepare(sak)}>
                  Sett opp avstemning
                </button>
              )}
              {sak.punkt && !sak.done && (
                <button type="button" className="text-xs text-white/50 hover:text-red-300" disabled={busy} onClick={() => onRemove(sak.punkt!)}>
                  Fjern saken
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <form
        className="flex gap-2"
        onSubmit={event => {
          event.preventDefault()
          if (!title.trim()) return
          onAdd(title.trim())
          setTitle('')
        }}
      >
        <input className={INPUT} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ny sak, for eksempel «Valg av styre»" aria-label="Ny sak" maxLength={140} />
        <button type="submit" className={`${BUTTON_GHOST} shrink-0`} disabled={busy || !title.trim()}>
          Legg til
        </button>
      </form>
      {running && open.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-white/60 hover:text-white">Sett opp en annen votering om forslagene</summary>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select className={SELECT} value={a} onChange={event => setA(event.target.value)} aria-label="Forslag">
              <option value="">Velg forslag</option>
              {open.map(proposal => (
                <option key={proposal.number} value={proposal.number}>
                  Forslag {proposal.number}: {proposal.title}
                </option>
              ))}
            </select>
            <span className="text-sm text-white/50">mot</span>
            <select className={SELECT} value={b} onChange={event => setB(event.target.value)} aria-label="Mot">
              <option value="">Vedtektene slik de er</option>
              {open
                .filter(proposal => String(proposal.number) !== a)
                .map(proposal => (
                  <option key={proposal.number} value={proposal.number}>
                    Forslag {proposal.number}: {proposal.title}
                  </option>
                ))}
            </select>
            <button type="button" className={BUTTON_GHOST} disabled={busy || !a} onClick={() => onOpen(Number(a), b ? Number(b) : null)}>
              Start
            </button>
          </div>
        </details>
      )}
    </div>
  )
}

function Attendance({ token, live, busy, act }: { token: string; live: Live; busy: boolean; act: (action: () => Promise<Live>) => void }) {
  const [members, setMembers] = useState<FeedMember[]>([])
  const [chosen, setChosen] = useState('')
  useEffect(() => {
    let active = true
    listMembers(token)
      .then(loaded => active && setMembers(loaded))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [token])
  const present = new Set(live.attendees.map(member => member.id))
  const away = members.filter(member => !present.has(member.id))
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select className={SELECT} value={chosen} onChange={event => setChosen(event.target.value)} aria-label="Medlem">
          <option value="">Sjekk inn et medlem</option>
          {away.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={BUTTON_GHOST}
          disabled={busy || !chosen}
          onClick={() => {
            act(() => checkInMember(token, chosen))
            setChosen('')
          }}
        >
          Sjekk inn
        </button>
      </div>
      <ul className="divide-y divide-white/10">
        {live.attendees.map(member => (
          <li key={member.id} className="flex items-center gap-2 py-1.5 text-sm text-white/80">
            <Avatar name={member.name} path={member.avatar} className="h-6 w-6 text-[10px]" />
            <span className="min-w-0 flex-1 truncate">{member.name}</span>
            <button type="button" className="text-xs text-white/50 hover:text-red-300" disabled={busy} onClick={() => act(() => checkOutMember(token, member.id))}>
              Fjern
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Controls({ token, live, busy, act }: { token: string; live: Live; busy: boolean; act: (action: () => Promise<Live>) => void }) {
  const meeting = live.arsmote!
  const open = live.voteringer.find(vote => vote.status === 'åpen')
  const tie = live.voteringer.find(vote => vote.status === 'likt')
  // A case on the agenda the protocol group is setting up a vote on
  const [prepared, setPrepared] = useState<Sak | null>(null)
  const [moving, setMoving] = useState(false)
  const adopted = live.voteringer.filter(vote => vote.kind === 'endelig' && vote.result === 0)
  return (
    <section className={`${CARD} space-y-5 p-4 sm:p-5`}>
      <h2 className={LABEL}>Protokollfører</h2>
      {meeting.state === 'planlagt' &&
        (moving ? (
          <ArsmoteForm
            token={token}
            meeting={meeting}
            onSaved={() => {
              setMoving(false)
              act(() => getLive(token))
            }}
            onCancel={() => setMoving(false)}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={BUTTON_PRIMARY} disabled={busy} onClick={() => act(() => startArsmote(token))}>
              Start årsmøtet nå
            </button>
            <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => setMoving(true)}>
              Endre tidspunkt
            </button>
          </div>
        ))}
      {open && <CloseVote key={open.id} vote={open} busy={busy} onClose={hand => act(() => closeVotering(token, open.id, hand))} />}
      {tie && (
        <TieDecision
          key={tie.id}
          vote={tie}
          busy={busy}
          onLot={option => act(() => drawLot(token, tie.id, option))}
          onRevote={keep => act(() => revote(token, tie.id, keep))}
        />
      )}
      {meeting.state === 'pågår' && !open && !tie && (
        <FreeVote
          key={prepared?.key ?? 'fri'}
          sak={prepared}
          busy={busy}
          onOpen={(title, options, rule, sak) => {
            act(() => openFreeVotering(token, title, options, rule, sak))
            setPrepared(null)
          }}
        />
      )}
      {meeting.state !== 'avsluttet' && (
        <Agenda
          live={live}
          busy={busy}
          onOrder={order => act(() => setAgenda(token, order))}
          onAdd={title => act(() => addPunkt(token, title))}
          onRemove={punkt => act(() => removePunkt(token, punkt))}
          onOpen={(a, b, opptak) => act(() => openVotering(token, a, b, opptak))}
          onPrepare={setPrepared}
        />
      )}
      {meeting.state === 'pågår' && (
        <details>
          <summary className="cursor-pointer text-sm text-white/60 hover:text-white">Oppmøte ({live.attendees.length})</summary>
          <div className="mt-2">
            <Attendance token={token} live={live} busy={busy} act={act} />
          </div>
        </details>
      )}
      {adopted.length > 0 && (
        <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-white/70">
          <p>
            {adopted.length === 1 ? 'Ett forslag' : `${adopted.length} forslag`} er vedtatt. Etter årsmøtet skrives de inn i vedtektene med{' '}
            <a href={ADOPT_WORKFLOW} target="_blank" rel="noreferrer" className="text-teb-orange hover:underline">
              «Skriv inn vedtakene fra årsmøtet»
            </a>{' '}
            på GitHub. Den lager en pull request med endringene og en ny PDF.
          </p>
        </div>
      )}
      {meeting.state === 'pågår' && !open && !tie && (
        <button
          type="button"
          className={BUTTON_DANGER}
          disabled={busy}
          onClick={() => window.confirm('Avslutte årsmøtet? Da kan det ikke stemmes mer.') && act(() => endArsmote(token))}
        >
          Avslutt årsmøtet
        </button>
      )}
    </section>
  )
}

function Meeting({ token }: { token: string }) {
  const { document: vedtekter } = useVedtekter(token)
  const [live, setLive] = useState<Live | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Asks again every few seconds while the page is in front, so votes open and close by themselves
  useEffect(() => {
    let active = true
    const load = () => {
      if (document.hidden) return
      getLive(token)
        .then(loaded => {
          if (!active) return
          setLive(loaded)
          setError(null)
        })
        .catch(err => active && setError(errorMessage(err)))
    }
    load()
    const timer = window.setInterval(load, POLL_MS)
    document.addEventListener('visibilitychange', load)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', load)
    }
  }, [token])

  const act = async (action: () => Promise<Live>) => {
    setBusy(true)
    setActionError(null)
    try {
      setLive(await action())
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!live) return <p className={`mt-10 text-center text-sm ${error ? 'text-red-300' : 'text-white/60'}`}>{error ?? 'Henter årsmøtet …'}</p>
  const meeting = live.arsmote
  if (!meeting) {
    return (
      <div className={`${CARD} mx-auto mt-5 md:mt-8 max-w-xl space-y-3 p-5 text-sm text-white/70`}>
        <p>Ingen årsmøte er satt opp.{live.canManage ? '' : ' Protokollføreren setter det opp.'}</p>
        {live.canManage && <ArsmoteForm token={token} meeting={null} onSaved={() => void act(() => getLive(token))} />}
      </div>
    )
  }
  const open = live.voteringer.find(vote => vote.status === 'åpen')
  const tie = live.voteringer.find(vote => vote.status === 'likt')
  const closed = live.voteringer.filter(vote => vote.status === 'lukket').reverse()
  const running = meeting.state === 'pågår'

  // On a computer, two columns: what goes on to the left, and to the right what the protocol group
  // runs it with, or for everyone else the votes so far and who is there
  const votes = (
    <>
          {closed.length > 0 && (
            <section className="space-y-3">
              <h2 className={LABEL}>Voteringer</h2>
              <ul className="space-y-2">
                {closed.map(vote => (
                  <Result key={vote.id} vote={vote} />
                ))}
              </ul>
            </section>
          )}
    </>
  )
  return (
    <div className="mx-auto mt-5 max-w-xl space-y-5 md:mt-8 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
      <div className="space-y-5">
        <header className={`${CARD} p-4 sm:p-5`}>
          <p className={LABEL}>{running ? 'Pågår' : meeting.state === 'planlagt' ? 'Planlagt' : 'Avsluttet'}</p>
          <h2 className="mt-1 text-2xl font-bold text-white">{meeting.title}</h2>
          <p className="mt-1 text-sm text-white/60">{longTime(meeting.startedAt ?? meeting.startsAt)}</p>
          {running && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {live.present ? (
                <p className="text-sm font-semibold text-green-300">Du er sjekket inn</p>
              ) : (
                <button type="button" className={`${BUTTON_PRIMARY} w-full sm:w-auto`} disabled={busy} onClick={() => void act(() => checkIn(token))}>
                  Sjekk inn
                </button>
              )}
              <p className="text-sm text-white/60">{live.attendees.length} til stede</p>
            </div>
          )}
          {meeting.state === 'planlagt' && <p className="mt-3 text-sm text-white/60">Når årsmøtet starter, sjekker du inn og stemmer her.</p>}
        </header>

        {live.saker.length > 0 && <Saksliste saker={live.saker} />}
        {actionError && <p className={ERROR_TEXT}>{actionError}</p>}
        {error && <p className="text-sm text-amber-300">Mistet kontakten: {error}</p>}

        {open && <OpenVote key={open.id} vote={open} document={vedtekter} present={live.present} busy={busy} onVote={choice => void act(() => castVote(token, open.id, choice))} />}
        {tie && <TieCard vote={tie} />}
        {running && !open && !tie && !live.canManage && (
          <p className={`${CARD} p-4 text-sm text-white/60`}>Ingen votering akkurat nå. Siden oppdaterer seg selv når neste starter.</p>
        )}
        {/* The protocol group sees the votes so far beside its panel on a computer, and under it on a phone */}
        {live.canManage && <div className="hidden lg:block">{votes}</div>}
      </div>

      <div className="space-y-5">
        {live.canManage && <Controls token={token} live={live} busy={busy} act={action => void act(action)} />}
        <div className={live.canManage ? 'lg:hidden' : ''}>{votes}</div>
        {live.attendees.length > 0 && !live.canManage && (
          <details className="text-sm">
            <summary className="cursor-pointer text-white/60 hover:text-white">Til stede ({live.attendees.length})</summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {live.attendees.map(member => (
                <li key={member.id} className="flex items-center gap-1.5 rounded-full border border-white/10 py-0.5 pl-0.5 pr-2.5 text-white/80">
                  <Avatar name={member.name} path={member.avatar} className="h-5 w-5 text-[9px]" />
                  {member.name}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}

// The årsmøte: members check in and vote on their phones, the protocol group runs the votes
export default function Arsmote() {
  return (
    <VedtekterLayout tab="arsmote" wide>
      {token => <Meeting token={token} />}
    </VedtekterLayout>
  )
}
