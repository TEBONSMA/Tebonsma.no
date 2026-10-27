import { useState } from 'react'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT, SELECT } from '../feed/styles'
import { errorMessage } from '../../lib/feed'
import { flatten, type Arsmote, type ChangeInput, type Paragraf, type Vedtekter } from '../../lib/vedtekter'
import ChangeView from './ChangeView'
import { draftAt, inputOf, placements, showDraft, type Draft, type Placed } from './changes'

export interface FormValues {
  title: string
  reason: string
  changes: ChangeInput[]
}

const LABEL = 'block text-xs font-semibold uppercase tracking-wider text-white/50'

function ParagraphSelect({ paragraphs, value, onChange, empty }: { paragraphs: Paragraf[]; value: string; onChange: (id: string) => void; empty: string }) {
  return (
    <select className={SELECT} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{empty}</option>
      {flatten(paragraphs).map(({ paragraph }) => (
        <option key={paragraph.id} value={paragraph.id}>
          {'  '.repeat(paragraph.niva - 1)}§ {paragraph.nummer} {paragraph.tittel}
        </option>
      ))}
    </select>
  )
}

interface ChangeEditorProps {
  document: Vedtekter
  draft: Draft
  // Where a new paragraph goes among the others in the proposal
  placed: Placed | null
  onChange: (draft: Draft) => void
  onRemove: (() => void) | null
}

function ChangeEditor({ document, draft, placed, onChange, onRemove }: ChangeEditorProps) {
  const input = inputOf(document, draft)
  const chosen = draft.type === 'legge-til' || !!draft.target
  const shown = chosen ? showDraft(document, input, placed) : null
  const number = placed?.number ?? ''

  return (
    <div className={`${CARD} space-y-3 p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={`${SELECT} w-auto`}
          value={draft.type}
          onChange={event => onChange({ ...draftAt(document, event.target.value as Draft['type'], draft.target || draft.anchor), key: draft.key })}
          aria-label="Hva endringen gjør"
        >
          <option value="endre">Endre en paragraf</option>
          <option value="legge-til">Legge til en paragraf</option>
          <option value="slette">Slette en paragraf</option>
        </select>
        {onRemove && (
          <button type="button" className="ml-auto text-sm text-white/50 hover:text-red-300" onClick={onRemove}>
            Fjern endringen
          </button>
        )}
      </div>

      {draft.type === 'legge-til' ? (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className={LABEL}>Ved paragraf</span>
            <ParagraphSelect paragraphs={document.paragrafer} value={draft.anchor} onChange={anchor => onChange({ ...draft, anchor })} empty="Først i vedtektene" />
          </label>
          {draft.anchor && (
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {(['etter', 'under'] as const).map(position => (
                <label key={position} className="flex items-center gap-1.5">
                  <input type="radio" name={`plassering-${draft.key}`} checked={draft.position === position} onChange={() => onChange({ ...draft, position })} />
                  {position === 'etter' ? 'Rett etter den' : 'Først under den'}
                </label>
              ))}
            </div>
          )}
          <p className="text-sm text-white/60">Den nye paragrafen blir § {number}.</p>
        </div>
      ) : (
        <label className="block space-y-1">
          <span className={LABEL}>Paragraf</span>
          <ParagraphSelect
            paragraphs={document.paragrafer}
            value={draft.target}
            // A new paragraph to change starts with the text it has now
            onChange={target => onChange({ ...draftAt(document, draft.type, target), key: draft.key })}
            empty="Velg en paragraf"
          />
        </label>
      )}

      {draft.type !== 'slette' && chosen && (
        <>
          <label className="block space-y-1">
            <span className={LABEL}>Tittel</span>
            <input className={INPUT} value={draft.title} maxLength={200} onChange={event => onChange({ ...draft, title: event.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className={LABEL}>Tekst</span>
            <textarea
              className={`${INPUT} font-mono text-[13px] leading-relaxed`}
              value={draft.text}
              maxLength={10_000}
              rows={Math.min(20, Math.max(6, draft.text.split('\n').length + 2))}
              onChange={event => onChange({ ...draft, text: event.target.value })}
            />
          </label>
        </>
      )}

      {shown && (
        <div className="space-y-1">
          <span className={LABEL}>Slik blir det</span>
          <ChangeView change={shown} />
        </div>
      )}
    </div>
  )
}

interface ForslagFormProps {
  document: Vedtekter
  heading: string
  initial: { title: string; reason: string; changes: Draft[] }
  arsmote: Arsmote | null
  // The buttons: save as a draft, or send it in
  actions: { label: string; submit: boolean; primary?: boolean }[]
  onSave: (values: FormValues, submit: boolean) => Promise<void>
  onCancel: () => void
}

// A proposal: what it is called, why, and the changes it makes, each shown as it would turn out
export default function ForslagForm({ document, heading, initial, arsmote, actions, onSave, onCancel }: ForslagFormProps) {
  const [title, setTitle] = useState(initial.title)
  const [reason, setReason] = useState(initial.reason)
  const [drafts, setDrafts] = useState<Draft[]>(initial.changes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const placed = placements(document, drafts.map(draft => inputOf(document, draft)))

  const save = async (submit: boolean) => {
    if (drafts.some(draft => draft.type !== 'legge-til' && !draft.target)) {
      setError('Velg paragrafen for hver endring.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({ title, reason, changes: drafts.map(draft => inputOf(document, draft)) }, submit)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form className="mx-auto mt-5 md:mt-8 max-w-3xl space-y-5" onSubmit={event => event.preventDefault()}>
      <h2 className="text-2xl font-bold text-white">{heading}</h2>

      <label className="block space-y-1">
        <span className={LABEL}>Tittel på forslaget</span>
        <input className={INPUT} value={title} maxLength={140} onChange={event => setTitle(event.target.value)} placeholder="Kort om hva forslaget gjør" />
      </label>
      <label className="block space-y-1">
        <span className={LABEL}>Begrunnelse</span>
        <textarea className={`${INPUT} min-h-24`} value={reason} maxLength={5000} onChange={event => setReason(event.target.value)} placeholder="Hvorfor bør årsmøtet vedta dette?" />
      </label>

      <div className="space-y-3">
        <span className={LABEL}>Endringer</span>
        {drafts.map((draft, i) => (
          <ChangeEditor
            key={draft.key}
            document={document}
            draft={draft}
            placed={placed[i]}
            onChange={changed => setDrafts(list => list.map((item, j) => (j === i ? changed : item)))}
            onRemove={drafts.length > 1 ? () => setDrafts(list => list.filter((_, j) => j !== i)) : null}
          />
        ))}
        {drafts.length < 10 && (
          <button type="button" className={BUTTON_GHOST} onClick={() => setDrafts(list => [...list, draftAt(document, 'endre', '')])}>
            Legg til en endring til
          </button>
        )}
      </div>

      <details className="text-sm text-white/60">
        <summary className="cursor-pointer text-white/70">Slik skrives teksten</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Hver linje blir en egen linje. En tom linje gir et nytt avsnitt.</li>
          <li>Linjer som starter med «- » blir en punktliste, og med to mellomrom foran en liste i lista.</li>
          <li>*kursiv*, **fet** og &lt;u&gt;understreket&lt;/u&gt;.</li>
          <li>§[id] viser til en annen paragraf, for eksempel §[mistillitsforslag]. Id-en står i adressen når du klikker på et §-nummer.</li>
        </ul>
      </details>

      {arsmote && (
        <p className="text-sm text-white/60">
          Forslag til {arsmote.title} må være sendt inn innen {new Date(arsmote.forslagFrist).toLocaleString('nb', { dateStyle: 'long', timeStyle: 'short' })} (§ 3).
        </p>
      )}
      {error && <p className={ERROR_TEXT}>{error}</p>}

      <div className="flex flex-wrap gap-2">
        {actions.map(action => (
          <button key={action.label} type="button" className={action.primary ? BUTTON_PRIMARY : BUTTON_GHOST} disabled={busy} onClick={() => void save(action.submit)}>
            {action.label}
          </button>
        ))}
        <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  )
}
