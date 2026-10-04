import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CalendarPlus, ChartBar, Globe, ImagePlus, Lock, Paperclip, Plus, X } from 'lucide-react'
import { fromLocalInput, MAX_EVENT_LOCATION_LENGTH, MAX_EVENT_TITLE_LENGTH, toLocalInput } from '../../lib/events'
import {
  createPost,
  errorMessage,
  MAX_ATTACHMENTS,
  MAX_POLL_OPTION_LENGTH,
  MAX_POLL_OPTIONS,
  MAX_POST_LENGTH,
  updatePost,
  type Post,
  type Visibility,
} from '../../lib/feed'
import AttachmentChips from './AttachmentChips'
import { ACTION, BUTTON_GHOST, BUTTON_PRIMARY, ERROR_TEXT, INPUT } from './styles'
import { useAttachments } from './useAttachments'

const VISIBILITIES = [
  {
    value: 'members',
    label: 'Kun medlemmer',
    hint: 'Bare innloggede medlemmer ser innlegget',
    eventLabel: 'Lukket',
    eventHint: 'Bare innloggede medlemmer ser arrangementet, og de kan svare på om de kommer',
    Icon: Lock,
  },
  {
    value: 'public',
    label: 'Alle',
    hint: 'Synlig for hele verden, også uten innlogging',
    eventLabel: 'Offentlig',
    eventHint: 'Synlig for hele verden, også uten innlogging. Offentlige arrangementer har ikke påmelding.',
    Icon: Globe,
  },
] as const

// The times as the date fields hold them: on the member's own clock
interface EventFields {
  title: string
  location: string
  startsAt: string
  endsAt: string
  betting: boolean
}

// New events are open for betting on TebBet unless the organizer says no
const NEW_EVENT: EventFields = { title: '', location: '', startsAt: '', endsAt: '', betting: true }

const eventFieldsOf = (post: Post | undefined): EventFields | null =>
  post?.event
    ? {
        title: post.event.title,
        location: post.event.location,
        startsAt: toLocalInput(post.event.startsAt),
        endsAt: toLocalInput(post.event.endsAt),
        betting: post.event.betting,
      }
    : null

interface PostEditorProps {
  token: string
  // The post being edited; without it a new post is written
  post?: Post
  // Write a new event rather than a plain post
  startAsEvent?: boolean
  onSaved: (post: Post) => void
  onCancel?: () => void
}

const PostEditor = ({ token, post, startAsEvent = false, onSaved, onCancel }: PostEditorProps) => {
  const pictureInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [body, setBody] = useState(post?.body ?? '')
  const [visibility, setVisibility] = useState<Visibility>(post?.visibility ?? 'members')
  const files = useAttachments(token, MAX_ATTACHMENTS, post?.attachments)
  const [pollOptions, setPollOptions] = useState<string[] | null>(null)
  const [event, setEvent] = useState<EventFields | null>(eventFieldsOf(post) ?? (startAsEvent ? NEW_EVENT : null))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFilesChosen = (e: ChangeEvent<HTMLInputElement>) => {
    files.upload(e.target.files)
    // So choosing the same file again counts as a new choice
    e.target.value = ''
  }

  const filledOptions = pollOptions?.map(option => option.trim()).filter(Boolean) ?? []
  const text = body.trim()
  // An event needs its title, and both times or neither
  const eventReady = !!event && event.title.trim() !== '' && !event.startsAt === !event.endsAt
  const contentReady = event
    ? eventReady
    : pollOptions
      ? text !== '' && filledOptions.length >= 2
      : text !== '' || files.attachments.length > 0
  const ready = files.uploading === 0 && !saving && contentReady

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const input = {
      body,
      visibility,
      attachmentIds: files.attachments.map(a => a.id),
      ...(event && {
        event: {
          title: event.title,
          location: event.location,
          startsAt: fromLocalInput(event.startsAt),
          endsAt: fromLocalInput(event.endsAt),
          betting: event.betting,
        },
      }),
    }
    try {
      if (post) {
        onSaved(await updatePost(token, post.id, input))
      } else {
        onSaved(await createPost(token, { ...input, ...(pollOptions && { pollOptions: filledOptions }) }))
        setBody('')
        files.clear()
        setPollOptions(null)
        setEvent(startAsEvent ? NEW_EVENT : null)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const setOption = (index: number, value: string) =>
    setPollOptions(options => options?.map((option, i) => (i === index ? value : option)) ?? null)

  const setField = (field: keyof EventFields, value: string) => setEvent(fields => fields && { ...fields, [field]: value })

  // Choosing when it starts puts the end a few hours later, as a place to begin
  const setStart = (value: string) =>
    setEvent(
      fields =>
        fields && {
          ...fields,
          startsAt: value,
          endsAt: fields.endsAt || !value ? fields.endsAt : toLocalInput(new Date(new Date(value).getTime() + 3 * 3_600_000).toISOString()),
        },
    )

  return (
    <form onSubmit={save} className="space-y-3">
      {event && (
        <fieldset className="space-y-2 rounded-md border border-white/10 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-white/50">Arrangement</legend>
          <input
            className={INPUT}
            value={event.title}
            onChange={e => setField('title', e.target.value)}
            maxLength={MAX_EVENT_TITLE_LENGTH}
            placeholder="Hva heter arrangementet?"
            aria-label="Tittel"
            required
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Starter</span>
              <input
                type="datetime-local"
                className={`${INPUT} [color-scheme:dark]`}
                value={event.startsAt}
                onChange={e => setStart(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Slutter</span>
              <input
                type="datetime-local"
                className={`${INPUT} [color-scheme:dark]`}
                value={event.endsAt}
                min={event.startsAt || undefined}
                onChange={e => setField('endsAt', e.target.value)}
              />
            </label>
          </div>
          <input
            className={INPUT}
            value={event.location}
            onChange={e => setField('location', e.target.value)}
            maxLength={MAX_EVENT_LOCATION_LENGTH}
            placeholder="Hvor? (valgfritt)"
            aria-label="Sted"
          />
          <label className="flex items-start gap-2.5 py-1 text-sm text-white/80">
            <input
              type="checkbox"
              checked={event.betting}
              onChange={e => setEvent(fields => fields && { ...fields, betting: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-teb-orange"
            />
            <span>
              Åpent for spill på TebBet
              <span className="block text-xs text-white/50">Medlemmene kan satse TEB-mynter på ting som skjer på arrangementet.</span>
            </span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-white/50">La tidspunktene stå tomme hvis datoen ikke er bestemt ennå.</p>
            {!post && !startAsEvent && (
              <button type="button" className={ACTION} onClick={() => setEvent(null)}>
                Fjern arrangementet
              </button>
            )}
          </div>
        </fieldset>
      )}

      <textarea
        className={`${INPUT} min-h-24 resize-y`}
        value={body}
        onChange={e => setBody(e.target.value)}
        maxLength={MAX_POST_LENGTH}
        placeholder={event ? 'Beskriv arrangementet' : pollOptions ? 'Hva vil du spørre om?' : 'Hva skjer?'}
        aria-label={event ? 'Beskrivelse' : 'Innlegg'}
      />

      {pollOptions && (
        <fieldset className="space-y-2 rounded-md border border-white/10 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-white/50">Spørreundersøkelse</legend>
          {pollOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className={INPUT}
                value={option}
                onChange={e => setOption(index, e.target.value)}
                maxLength={MAX_POLL_OPTION_LENGTH}
                placeholder={`Svaralternativ ${index + 1}`}
                aria-label={`Svaralternativ ${index + 1}`}
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                  aria-label={`Fjern svaralternativ ${index + 1}`}
                  className="rounded p-2 text-white/50 cursor-pointer hover:bg-white/10 hover:text-white"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {pollOptions.length < MAX_POLL_OPTIONS ? (
              <button type="button" className={ACTION} onClick={() => setPollOptions([...pollOptions, ''])}>
                <Plus size={16} aria-hidden="true" />
                Legg til alternativ
              </button>
            ) : (
              <span />
            )}
            <button type="button" className={ACTION} onClick={() => setPollOptions(null)}>
              Fjern spørreundersøkelsen
            </button>
          </div>
        </fieldset>
      )}

      {post?.poll && (
        <p className="text-xs text-white/50">Spørreundersøkelsen kan ikke endres etter at innlegget er publisert.</p>
      )}

      <AttachmentChips attachments={files.attachments} uploading={files.uploading} token={token} onRemove={files.remove} />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className={ACTION} onClick={() => pictureInput.current?.click()}>
            <ImagePlus size={18} aria-hidden="true" />
            Bilde
          </button>
          <button type="button" className={ACTION} onClick={() => fileInput.current?.click()}>
            <Paperclip size={18} aria-hidden="true" />
            Fil
          </button>
          {!post && !pollOptions && !event && (
            <>
              <button type="button" className={ACTION} onClick={() => setPollOptions(['', ''])}>
                <ChartBar size={18} aria-hidden="true" />
                Spørreundersøkelse
              </button>
              <button type="button" className={ACTION} onClick={() => setEvent(NEW_EVENT)}>
                <CalendarPlus size={18} aria-hidden="true" />
                Arrangement
              </button>
            </>
          )}
          <input ref={pictureInput} type="file" multiple accept="image/*" className="hidden" onChange={onFilesChosen} />
          <input ref={fileInput} type="file" multiple className="hidden" onChange={onFilesChosen} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label={event ? 'Hvem kan se arrangementet' : 'Hvem kan se innlegget'}
            className="flex rounded-md border border-white/10 p-0.5"
          >
            {VISIBILITIES.map(({ value, label, hint, eventLabel, eventHint, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={visibility === value}
                title={event ? eventHint : hint}
                onClick={() => setVisibility(value)}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  visibility === value ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {event ? eventLabel : label}
              </button>
            ))}
          </div>
          {onCancel && (
            <button type="button" className={BUTTON_GHOST} onClick={onCancel} disabled={saving}>
              Avbryt
            </button>
          )}
          <button type="submit" className={BUTTON_PRIMARY} disabled={!ready}>
            {saving ? 'Lagrer…' : post ? 'Lagre' : 'Publiser'}
          </button>
        </div>
      </div>

      <p className="text-xs text-white/50">
        {VISIBILITIES.filter(v => v.value === visibility).map(v => (event ? v.eventHint : v.hint))}
      </p>
      {(error ?? files.error) && <p className={ERROR_TEXT}>{error ?? files.error}</p>}
    </form>
  )
}

export default PostEditor
