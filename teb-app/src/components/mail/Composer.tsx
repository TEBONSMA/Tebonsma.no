import { useEffect, useRef, useState } from 'react'
import { Paperclip, Send, Trash2, X } from 'lucide-react'
import { errorMessage, formatSize } from '../../lib/feed'
import {
  deleteDraft,
  getOfflineStatus,
  MAX_MAIL_ATTACHMENT_BYTES,
  MAX_MAIL_ATTACHMENTS,
  MAX_RECIPIENTS,
  saveDraft,
  scheduleMail,
  sendMail,
  startOffline,
  uploadMailFile,
  type ComposeFields,
  type ComposeSeed,
  type Member,
  type OfflineStatus,
  type Person,
  type Sent,
} from '../../lib/mail'
import AttachmentChips from '../feed/AttachmentChips'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT } from '../feed/styles'
import { useAttachments } from '../feed/useAttachments'
import RecipientInput from './RecipientInput'
import ScheduleMenu from './ScheduleMenu'
import RichEditor from './RichEditor'

const AUTOSAVE_MS = 1500

interface ComposerProps {
  token: string
  seed: ComposeSeed
  members: Member[]
  // The writing window was closed. The mail is kept as a draft if anything was written.
  onClose: () => void
  // The mail was sent, or is waiting out the time it can be taken back in
  onSent: (sent: Sent, seed: ComposeSeed) => void
  // The mail was put aside to be sent at this time
  onScheduled: (sendAt: string) => void
}

const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0

const snapshotOf = (fields: ComposeFields, attachmentIds: string[]) =>
  JSON.stringify([fields.to, fields.cc, fields.bcc, fields.subject, fields.html, attachmentIds])

type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

const STATUS: Record<SaveState, string> = { idle: '', saving: 'Lagrer…', saved: 'Lagret i kladder', failed: 'Kunne ikke lagre' }

const Composer = ({ token, seed, members, onClose, onSent, onScheduled }: ComposerProps) => {
  const [to, setTo] = useState<Person[]>(seed.fields.to)
  const [cc, setCc] = useState<Person[]>(seed.fields.cc)
  const [bcc, setBcc] = useState<Person[]>(seed.fields.bcc)
  const [showCc, setShowCc] = useState(seed.fields.cc.length > 0 || seed.fields.bcc.length > 0)
  const [subject, setSubject] = useState(seed.fields.subject)
  const [html, setHtml] = useState(seed.fields.html)
  // The draft keeps the mail between saves, under an id made here
  const [draftId] = useState(() => seed.fields.draftId ?? crypto.randomUUID())
  const [initial] = useState(() => snapshotOf(seed.fields, seed.attachments.map(a => a.id)))
  const [saved, setSaved] = useState(initial)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Whether sending later is possible, and whether the member has given the permission it needs
  const [offline, setOffline] = useState<OfflineStatus | null>(null)

  useEffect(() => {
    let active = true
    getOfflineStatus(token)
      .then(status => active && setOffline(status))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [token])

  const files = useAttachments(token, MAX_MAIL_ATTACHMENTS, seed.attachments, {
    upload: uploadMailFile,
    maxBytes: MAX_MAIL_ATTACHMENT_BYTES,
    shrink: false,
  })

  const fields: ComposeFields = { ...seed.fields, to, cc, bcc, subject, html, draftId }
  const snapshot = snapshotOf(fields, files.attachments.map(a => a.id))
  const touched = snapshot !== initial
  const totalSize = files.attachments.reduce((sum, a) => sum + a.size, 0)
  const recipients = to.length + cc.length + bcc.length

  // Saved a moment after the last change, so nothing written is lost
  useEffect(() => {
    if (!touched || snapshot === saved || sending) return
    const timer = setTimeout(() => {
      setSaveState('saving')
      saveDraft(token, draftId, fields, files.attachments)
        .then(() => {
          setSaved(snapshot)
          setSaveState('saved')
        })
        .catch(() => setSaveState('failed'))
    }, AUTOSAVE_MS)
    return () => clearTimeout(timer)
    // fields is made from the pieces listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, draftId, touched, snapshot, saved, sending])

  const close = async () => {
    // What was written since the last save is kept before the window goes
    if (touched && snapshot !== saved) {
      setSaveState('saving')
      try {
        await saveDraft(token, draftId, fields, files.attachments)
      } catch (err) {
        setError(`Kladden ble ikke lagret: ${errorMessage(err)}`)
        setSaveState('failed')
        return
      }
    }
    onClose()
  }

  const discard = async () => {
    try {
      // Only a draft that has been saved has anything to delete
      if (saved !== initial || seed.fields.draftId) await deleteDraft(token, draftId)
    } catch (err) {
      setError(errorMessage(err))
      return
    }
    onClose()
  }

  // Checks the mail is ready to go, and says what is wrong when it isn't
  const ready = () => {
    setError(null)
    const problem =
      recipients === 0
        ? 'Legg til minst én mottaker'
        : recipients > MAX_RECIPIENTS
          ? `En mail kan ha opptil ${MAX_RECIPIENTS} mottakere`
          : files.uploading > 0
            ? 'Vent til filene er lastet opp'
            : totalSize > MAX_MAIL_ATTACHMENT_BYTES
              ? `Vedleggene er til sammen større enn ${formatSize(MAX_MAIL_ATTACHMENT_BYTES)}`
              : null
    if (problem) {
      setError(problem)
      return false
    }
    return subject.trim() !== '' || hasText(html) || window.confirm('Mailen har verken emne eller tekst. Sende den likevel?')
  }

  const send = async () => {
    if (!ready()) return
    setSending(true)
    try {
      const sent = await sendMail(token, fields, files.attachments)
      onSent(sent, { fields: { ...fields, draftId: sent.draftId }, attachments: files.attachments })
    } catch (err) {
      setError(errorMessage(err))
      setSending(false)
    }
  }

  const schedule = async (when: Date) => {
    if (!ready()) return
    setSending(true)
    try {
      const scheduled = await scheduleMail(token, fields, files.attachments, when.toISOString())
      onScheduled(scheduled.sendAt)
    } catch (err) {
      setError(errorMessage(err))
      setSending(false)
    }
  }

  // Saying yes happens at the login provider, so the mail is saved first and found again in Drafts
  const consent = async () => {
    setError(null)
    try {
      await saveDraft(token, draftId, fields, files.attachments)
      window.location.href = (await startOffline(token)).url
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Ny mail">
      <div className={`${CARD} flex max-h-full w-full max-w-3xl flex-col overflow-hidden bg-neutral-950`}>
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-white">{subject.trim() || 'Ny mail'}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40" aria-live="polite">
              {STATUS[saveState]}
            </span>
            <button type="button" onClick={close} aria-label="Lagre og lukk" title="Lagre og lukk" className="cursor-pointer rounded p-1 text-white/60 hover:bg-white/10 hover:text-white">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          <RecipientInput label="Til" people={to} onChange={setTo} members={members} />
          {showCc ? (
            <>
              <RecipientInput label="Kopi" people={cc} onChange={setCc} members={members} />
              <RecipientInput label="Blindkopi" people={bcc} onChange={setBcc} members={members} />
            </>
          ) : (
            <button type="button" onClick={() => setShowCc(true)} className="ml-[5.5rem] cursor-pointer text-xs text-white/50 hover:text-white">
              Kopi og blindkopi
            </button>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="mail-subject" className="w-20 shrink-0 text-sm text-white/50">
              Emne
            </label>
            <input id="mail-subject" className={INPUT} value={subject} onChange={e => setSubject(e.target.value)} maxLength={250} />
          </div>

          <RichEditor initialHtml={html} onChange={setHtml} />

          <AttachmentChips attachments={files.attachments} uploading={files.uploading} token={token} onRemove={files.remove} />
          {files.error && <p className={ERROR_TEXT}>{files.error}</p>}
          {files.attachments.length > 0 && (
            <p className="text-xs text-white/40">
              {files.attachments.length} vedlegg · {formatSize(totalSize)} av {formatSize(MAX_MAIL_ATTACHMENT_BYTES)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" className={BUTTON_PRIMARY} onClick={send} disabled={sending}>
              <Send size={16} aria-hidden="true" />
              {sending ? 'Sender…' : 'Send'}
            </button>
            {offline?.available && <ScheduleMenu status={offline} disabled={sending} onSchedule={schedule} onConsent={consent} />}
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={e => {
                files.upload(e.target.files)
                e.target.value = ''
              }}
            />
            <button type="button" className={BUTTON_GHOST} onClick={() => fileRef.current?.click()}>
              <Paperclip size={16} aria-hidden="true" />
              Legg ved
            </button>
          </div>
          <div className="flex items-center gap-2">
            {error && <span className={ERROR_TEXT}>{error}</span>}
            <button type="button" className={BUTTON_GHOST} onClick={discard} disabled={sending}>
              <Trash2 size={16} aria-hidden="true" />
              Forkast
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Composer
