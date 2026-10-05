import { Link } from 'react-router-dom'
import { ArrowLeft, Download, ImageOff } from 'lucide-react'
import { downloadMailAttachment, senderName, type Folder, type Label, type MailAddress, type MailMessage } from '../../lib/mail'
import { errorMessage, formatDate, formatSize } from '../../lib/feed'
import { useState } from 'react'
import { BUTTON_GHOST, CARD, ERROR_TEXT } from '../feed/styles'
import LabelChips from './LabelChips'
import MailActions, { type MailActionHandlers } from './MailActions'
import MailFrame from './MailFrame'

const people = (list: MailAddress[]) => list.map(a => (a.name ? `${a.name} <${a.address}>` : a.address)).join(', ')

interface MailViewProps extends MailActionHandlers {
  token: string
  message: MailMessage
  // The list the mail was opened from, which Back returns to
  folder: string
  search: string
  folders: Folder[]
  labels: Label[]
  busy: boolean
  // Fetch the mail again with pictures from other sites in it
  showImages: boolean
  onShowImages: () => void
}

const MailView = ({ token, message, folder, search, folders, labels, busy, showImages, onShowImages, ...actions }: MailViewProps) => {
  const [downloadError, setDownloadError] = useState<string | null>(null)

  return (
    <article className="space-y-4 p-4">
      <Link to={`/mail/${encodeURIComponent(folder)}${search}`} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white lg:hidden">
        <ArrowLeft size={16} aria-hidden="true" />
        Tilbake
      </Link>

      <MailActions token={token} mails={[message]} folders={folders} labels={labels} current={message.folder} disabled={busy} {...actions} />

      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-white">{message.subject || '(uten emne)'}</h2>
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white">{senderName(message.from)}</span>
          {message.from?.name && <span className="text-white/50"> &lt;{message.from.address}&gt;</span>}
        </p>
        <p className="text-xs text-white/50">Til: {people(message.to) || '—'}</p>
        {message.cc.length > 0 && <p className="text-xs text-white/50">Kopi: {people(message.cc)}</p>}
        <p className="text-xs text-white/40">{formatDate(message.date)}</p>
        <LabelChips ids={message.labels} labels={labels} className="pt-1" />
      </header>

      {message.blockedImages > 0 && !showImages && (
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-2 p-3 text-sm text-white/70`}>
          <span className="inline-flex items-center gap-2">
            <ImageOff size={16} aria-hidden="true" />
            Bilder fra andre nettsteder er skjult. De kan fortelle avsenderen at du har åpnet mailen.
          </span>
          <button type="button" className={BUTTON_GHOST} onClick={onShowImages}>
            Vis bilder
          </button>
        </div>
      )}

      <MailFrame html={message.html} allowImages={showImages} title={message.subject || 'Mail'} />

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
    </article>
  )
}

export default MailView
