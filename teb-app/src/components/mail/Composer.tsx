import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2, Minus, Paperclip, Trash2, Type, X } from 'lucide-react'
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
import { BUTTON_PRIMARY, ERROR_TEXT } from '../feed/styles'
import { useAttachments } from '../feed/useAttachments'
import { cn } from '../../lib/utils'
import RecipientInput from './RecipientInput'
import RichEditor from './RichEditor'
import ScheduleMenu from './ScheduleMenu'

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
  // Kopi and Blindkopi get their own rows when asked for, or when the mail already has some
  const [showCc, setShowCc] = useState(seed.fields.cc.length > 0)
  const [showBcc, setShowBcc] = useState(seed.fields.bcc.length > 0)
  // A small window in the corner that the mail page stays usable behind, which can be rolled up to its title or opened wide
  const [view, setView] = useState<'normal' | 'minimized' | 'expanded'>('normal')
  const [showFormatting, setShowFormatting] = useState(false)
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

  const minimized = view === 'minimized'
  const expanded = view === 'expanded'
  const iconButton = 'cursor-pointer rounded p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white'

  // Drawn on the page itself rather than inside the mail page, so nothing on the page covers it
  return createPortal(
    <>
      {expanded && <div className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm" aria-hidden="true" />}
      <div
        role="dialog"
        aria-label="Ny mail"
        className={cn(
          'fixed z-[100] flex flex-col overflow-hidden border border-white/10 bg-neutral-950 shadow-[0_8px_48px_rgba(0,0,0,0.6)]',
          // On a phone it takes the whole screen, on larger screens it sits in the corner like Gmail's
          expanded
            ? 'inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(48rem,calc(100dvh-4rem))] sm:w-[min(60rem,calc(100vw-4rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg'
            : minimized
              ? 'bottom-0 right-0 w-full sm:right-6 sm:w-80 sm:rounded-t-lg'
              : 'inset-0 sm:inset-auto sm:bottom-0 sm:right-6 sm:h-[min(36rem,calc(100dvh-3rem))] sm:w-[34rem] sm:rounded-t-lg',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 bg-neutral-800 px-4 py-2">
          <button
            type="button"
            onClick={() => setView(minimized ? 'normal' : 'minimized')}
            className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold text-white"
            aria-label={minimized ? 'Åpne mailen' : 'Rull sammen'}
          >
            {subject.trim() || 'Ny mail'}
          </button>
          <div className="flex shrink-0 items-center gap-0.5">
            <span className="mr-2 hidden text-xs text-white/40 sm:inline" aria-live="polite">
              {STATUS[saveState]}
            </span>
            <button type="button" onClick={() => setView(minimized ? 'normal' : 'minimized')} aria-label={minimized ? 'Åpne' : 'Rull sammen'} title={minimized ? 'Åpne' : 'Rull sammen'} className={iconButton}>
              <Minus size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setView(expanded ? 'normal' : 'expanded')} aria-label={expanded ? 'Gjør mindre' : 'Utvid'} title={expanded ? 'Gjør mindre' : 'Utvid'} className={`${iconButton} hidden sm:block`}>
              {expanded ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            </button>
            <button type="button" onClick={close} aria-label="Lagre og lukk" title="Lagre og lukk" className={iconButton}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Kept in place while rolled up, so nothing written is lost */}
        <div className={cn('flex min-h-0 flex-1 flex-col', minimized && 'hidden')}>
          <RecipientInput
            bare
            label="Til"
            people={to}
            onChange={setTo}
            members={members}
            trailing={
              <span className="flex gap-2">
                {!showCc && (
                  <button type="button" onClick={() => setShowCc(true)} className="cursor-pointer hover:text-white">
                    Kopi
                  </button>
                )}
                {!showBcc && (
                  <button type="button" onClick={() => setShowBcc(true)} className="cursor-pointer hover:text-white">
                    Blindkopi
                  </button>
                )}
              </span>
            }
          />
          {showCc && <RecipientInput bare label="Kopi" people={cc} onChange={setCc} members={members} />}
          {showBcc && <RecipientInput bare label="Blindkopi" people={bcc} onChange={setBcc} members={members} />}
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4">
            <label htmlFor="mail-subject" className="sr-only">
              Emne
            </label>
            <input
              id="mail-subject"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/40 outline-none"
              placeholder="Emne"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={250}
            />
          </div>

          <RichEditor bare token={token} showToolbar={showFormatting} initialHtml={html} onChange={setHtml} />

          {(files.attachments.length > 0 || files.uploading > 0 || files.error) && (
            <div className="shrink-0 space-y-1 border-t border-white/10 px-4 py-2">
              <AttachmentChips attachments={files.attachments} uploading={files.uploading} token={token} onRemove={files.remove} />
              {files.error && <p className={ERROR_TEXT}>{files.error}</p>}
              {files.attachments.length > 0 && (
                <p className="text-xs text-white/40">
                  {files.attachments.length} vedlegg · {formatSize(totalSize)} av {formatSize(MAX_MAIL_ATTACHMENT_BYTES)}
                </p>
              )}
            </div>
          )}

          {error && <p className={`${ERROR_TEXT} shrink-0 px-4 pb-1`}>{error}</p>}

          <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex items-center gap-1">
              <div className="relative mr-2 flex">
                <button type="button" className={cn(BUTTON_PRIMARY, offline?.available && 'rounded-r-none')} onClick={send} disabled={sending}>
                  {sending ? 'Sender…' : 'Send'}
                </button>
                {offline?.available && <ScheduleMenu split status={offline} disabled={sending} onSchedule={schedule} onConsent={consent} />}
              </div>
              <button
                type="button"
                onClick={() => setShowFormatting(v => !v)}
                aria-pressed={showFormatting}
                aria-label="Formatering"
                title="Formatering"
                className={cn(iconButton, showFormatting && 'bg-white/10 text-white')}
              >
                <Type size={18} aria-hidden="true" />
              </button>
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
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Legg ved filer" title="Legg ved filer" className={iconButton}>
                <Paperclip size={18} aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={discard} disabled={sending} aria-label="Forkast kladden" title="Forkast kladden" className={`${iconButton} disabled:opacity-50`}>
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

export default Composer
