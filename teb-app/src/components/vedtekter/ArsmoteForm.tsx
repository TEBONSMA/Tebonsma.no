import { useState, type FormEvent } from 'react'
import { BUTTON_GHOST, BUTTON_PRIMARY, ERROR_TEXT, INPUT } from '../feed/styles'
import { errorMessage } from '../../lib/feed'
import { setArsmote, type Arsmote } from '../../lib/vedtekter'

// For <input type="datetime-local">, in local time
const localInput = (iso: string) => {
  const time = new Date(iso)
  return new Date(time.getTime() - time.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

// Setting the årsmøte, or moving it: its name and when it starts. Once it has started, the time
// stays, as the deadlines in § 3 follow from it.
export default function ArsmoteForm({
  token,
  meeting,
  onSaved,
  onCancel,
}: {
  token: string
  meeting: Arsmote | null
  onSaved: (meeting: Arsmote | null) => void
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(meeting?.title ?? `Ordinært årsmøte ${new Date().getFullYear()}`)
  const [startsAt, setStartsAt] = useState(meeting ? localInput(meeting.startsAt) : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const started = meeting?.state === 'pågår'

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      onSaved(await setArsmote(token, title, started ? meeting!.startsAt : new Date(startsAt).toISOString()))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={event => void save(event)}>
      <input className={INPUT} value={title} onChange={event => setTitle(event.target.value)} aria-label="Navn på årsmøtet" maxLength={100} required />
      <input
        className={`${INPUT} [color-scheme:dark]`}
        type="datetime-local"
        value={startsAt}
        onChange={event => setStartsAt(event.target.value)}
        aria-label="Når årsmøtet starter"
        disabled={started}
        required
      />
      {started && <p className="text-xs text-white/50 sm:col-span-2">Årsmøtet har startet, så tidspunktet står fast.</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className={BUTTON_PRIMARY} disabled={busy}>
          Lagre
        </button>
        {onCancel && (
          <button type="button" className={BUTTON_GHOST} onClick={onCancel}>
            Avbryt
          </button>
        )}
      </div>
      {error && <p className={`${ERROR_TEXT} sm:col-span-2`}>{error}</p>}
    </form>
  )
}
