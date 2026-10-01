import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ChartBar, FileText, Globe, ImagePlus, Lock, Paperclip, Plus, X } from 'lucide-react'
import {
  createPost,
  errorMessage,
  formatSize,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  MAX_POLL_OPTION_LENGTH,
  MAX_POLL_OPTIONS,
  MAX_POST_LENGTH,
  updatePost,
  uploadAttachment,
  type Attachment,
  type Post,
  type Visibility,
} from '../../lib/feed'
import { ACTION, BUTTON_GHOST, BUTTON_PRIMARY, ERROR_TEXT, INPUT } from './styles'
import { useImageSrc } from './useImageSrc'

const VISIBILITIES = [
  { value: 'members', label: 'Kun medlemmer', hint: 'Bare innloggede medlemmer ser innlegget', Icon: Lock },
  { value: 'public', label: 'Alle', hint: 'Synlig for hele verden, også uten innlogging', Icon: Globe },
] as const

function AttachmentChip({ attachment, token, onRemove }: { attachment: Attachment; token: string; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 py-1 pl-1 pr-1.5 text-sm">
      {attachment.isImage ? (
        <Thumbnail attachment={attachment} token={token} />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/5">
          <FileText size={18} aria-hidden="true" className="text-white/50" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block max-w-40 truncate text-white/90">{attachment.name}</span>
        <span className="block text-xs text-white/50">{formatSize(attachment.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Fjern ${attachment.name}`}
        className="rounded p-1 text-white/50 cursor-pointer hover:bg-white/10 hover:text-white"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </li>
  )
}

function Thumbnail({ attachment, token }: { attachment: Attachment; token: string }) {
  const src = useImageSrc(attachment, 'unsaved', token)
  return src ? (
    <img src={src} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
  ) : (
    <span className="h-9 w-9 shrink-0 rounded bg-white/10 animate-pulse" />
  )
}

interface PostEditorProps {
  token: string
  // The post being edited; without it a new post is written
  post?: Post
  onSaved: (post: Post) => void
  onCancel?: () => void
}

const PostEditor = ({ token, post, onSaved, onCancel }: PostEditorProps) => {
  const pictureInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [body, setBody] = useState(post?.body ?? '')
  const [visibility, setVisibility] = useState<Visibility>(post?.visibility ?? 'members')
  const [attachments, setAttachments] = useState<Attachment[]>(post?.attachments ?? [])
  const [uploading, setUploading] = useState(0)
  const [pollOptions, setPollOptions] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = (files: FileList | null) => {
    if (!files) return
    setError(null)
    const room = MAX_ATTACHMENTS - attachments.length - uploading
    const chosen = [...files]
    if (chosen.length > room) setError(`Et innlegg kan ha opptil ${MAX_ATTACHMENTS} vedlegg`)

    for (const file of chosen.slice(0, Math.max(0, room))) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`${file.name} er større enn ${formatSize(MAX_ATTACHMENT_BYTES)}`)
        continue
      }
      setUploading(n => n + 1)
      uploadAttachment(token, file)
        .then(uploaded => setAttachments(list => [...list, uploaded]))
        .catch(err => setError(`${file.name}: ${errorMessage(err)}`))
        .finally(() => setUploading(n => n - 1))
    }
  }

  const onFilesChosen = (e: ChangeEvent<HTMLInputElement>) => {
    upload(e.target.files)
    // So choosing the same file again counts as a new choice
    e.target.value = ''
  }

  const filledOptions = pollOptions?.map(option => option.trim()).filter(Boolean) ?? []
  const text = body.trim()
  const ready =
    uploading === 0 && !saving && (pollOptions ? text !== '' && filledOptions.length >= 2 : text !== '' || attachments.length > 0)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const input = { body, visibility, attachmentIds: attachments.map(a => a.id) }
    try {
      if (post) {
        onSaved(await updatePost(token, post.id, input))
      } else {
        onSaved(await createPost(token, { ...input, ...(pollOptions && { pollOptions: filledOptions }) }))
        setBody('')
        setAttachments([])
        setPollOptions(null)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const setOption = (index: number, value: string) =>
    setPollOptions(options => options?.map((option, i) => (i === index ? value : option)) ?? null)

  return (
    <form onSubmit={save} className="space-y-3">
      <textarea
        className={`${INPUT} min-h-24 resize-y`}
        value={body}
        onChange={e => setBody(e.target.value)}
        maxLength={MAX_POST_LENGTH}
        placeholder={pollOptions ? 'Hva vil du spørre om?' : 'Hva skjer?'}
        aria-label="Innlegg"
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

      {(attachments.length > 0 || uploading > 0) && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              token={token}
              onRemove={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
            />
          ))}
          {uploading > 0 && (
            <li className="flex items-center rounded-md border border-dashed border-white/15 px-3 text-sm text-white/50">
              Laster opp{uploading > 1 ? ` ${uploading} filer` : ''}…
            </li>
          )}
        </ul>
      )}

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
          {!post && !pollOptions && (
            <button type="button" className={ACTION} onClick={() => setPollOptions(['', ''])}>
              <ChartBar size={18} aria-hidden="true" />
              Spørreundersøkelse
            </button>
          )}
          <input ref={pictureInput} type="file" multiple accept="image/*" className="hidden" onChange={onFilesChosen} />
          <input ref={fileInput} type="file" multiple className="hidden" onChange={onFilesChosen} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Hvem kan se innlegget" className="flex rounded-md border border-white/10 p-0.5">
            {VISIBILITIES.map(({ value, label, hint, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={visibility === value}
                title={hint}
                onClick={() => setVisibility(value)}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  visibility === value ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {label}
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

      <p className="text-xs text-white/50">{VISIBILITIES.find(v => v.value === visibility)?.hint}</p>
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </form>
  )
}

export default PostEditor
