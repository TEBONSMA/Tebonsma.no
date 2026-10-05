import { useState } from 'react'
import { Download, ImageOff, Share2 } from 'lucide-react'
import { errorMessage, formatDate, formatSize } from '../../lib/feed'
import { downloadMailAttachment, senderName, type MailAddress, type MailSummary } from '../../lib/mail'
import { cn } from '../../lib/utils'
import { ACTION, BUTTON_GHOST, CARD, ERROR_TEXT } from '../feed/styles'
import MailFrame from './MailFrame'
import { useMessageBody } from './useMail'

const people = (list: MailAddress[]) => list.map(a => (a.name ? `${a.name} <${a.address}>` : a.address)).join(', ')

interface MailMessageCardProps {
  token: string
  mail: MailSummary
  // The newest mail and the ones that were unread start out open
  defaultOpen: boolean
  // Starts sharing this mail
  onShare: (mail: MailSummary) => void
}

// One mail in a conversation: its sender and time, and when opened its content and attachments
const MailMessageCard = ({ token, mail, defaultOpen, onShare }: MailMessageCardProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const [images, setImages] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const body = useMessageBody(mail.id, open, images)
  const message = body.message

  return (
    <section className={cn(CARD, 'overflow-hidden')}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-baseline gap-2 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{senderName(mail.from)}</span>
          {!open && <span className="block truncate text-xs text-white/50">{mail.preview}</span>}
        </span>
        <span className="shrink-0 text-xs text-white/40">{formatDate(mail.date)}</span>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          {body.loading && <p className="text-sm text-white/50">Laster mail…</p>}
          {body.error && <p className={ERROR_TEXT}>{body.error}</p>}
          {message && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5 text-xs text-white/50">
                  {message.from?.name && <p>Fra: {people([message.from])}</p>}
                  <p>Til: {people(message.to) || '—'}</p>
                  {message.cc.length > 0 && <p>Kopi: {people(message.cc)}</p>}
                </div>
                <button type="button" className={ACTION} onClick={() => onShare(mail)} title="Del denne mailen">
                  <Share2 size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Del</span>
                </button>
              </div>

              {message.blockedImages > 0 && !images && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <ImageOff size={16} aria-hidden="true" />
                    Bilder fra andre nettsteder er skjult. De kan fortelle avsenderen at du har åpnet mailen.
                  </span>
                  <button type="button" className={BUTTON_GHOST} onClick={() => setImages(true)}>
                    Vis bilder
                  </button>
                </div>
              )}

              <MailFrame html={message.html} allowImages={images} title={message.subject || 'Mail'} />

              {message.attachments.length > 0 && (
                <section aria-label="Vedlegg" className="space-y-2">
                  <h3 className="text-sm font-semibold text-white/80">Vedlegg</h3>
                  <ul className="flex flex-wrap gap-2">
                    {message.attachments.map(attachment => (
                      <li key={attachment.n}>
                        <button
                          type="button"
                          onClick={() => {
                            setDownloadError(null)
                            downloadMailAttachment(token, message.id, attachment).catch(err => setDownloadError(errorMessage(err)))
                          }}
                          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-sm cursor-pointer transition-colors hover:border-white/20"
                        >
                          <Download size={16} aria-hidden="true" className="shrink-0 text-white/50" />
                          <span className="min-w-0">
                            <span className="block max-w-48 truncate text-white/90">{attachment.name}</span>
                            <span className="block text-xs text-white/50">{formatSize(attachment.size)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {downloadError && <p className={ERROR_TEXT}>{downloadError}</p>}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default MailMessageCard
