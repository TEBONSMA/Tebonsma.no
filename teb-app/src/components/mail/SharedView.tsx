import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { errorMessage, formatDate, formatSize } from '../../lib/feed'
import { downloadSharedAttachment, senderName, type MailAddress, type SharedMail } from '../../lib/mail'
import Avatar from '../Avatar'
import { ACTION, CARD, ERROR_TEXT } from '../feed/styles'
import MailFrame from './MailFrame'

const people = (list: MailAddress[]) => list.map(a => (a.name ? `${a.name} <${a.address}>` : a.address)).join(', ')

interface SharedViewProps {
  token: string
  mail: SharedMail
  search: string
  busy: boolean
  onDelete: () => void
}

// A mail another member shared: a copy kept by the site, so it can be read and downloaded but not answered
const SharedView = ({ token, mail, search, busy, onDelete }: SharedViewProps) => {
  const [error, setError] = useState<string | null>(null)

  return (
    <article className="space-y-4 p-4">
      <Link to={`/mail/shared${search}`} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white lg:hidden">
        <ArrowLeft size={16} aria-hidden="true" />
        Tilbake
      </Link>

      <button type="button" className={ACTION} disabled={busy} onClick={onDelete}>
        <Trash2 size={16} aria-hidden="true" />
        Fjern fra Delt med meg
      </button>

      <div className={`${CARD} space-y-2 p-3`}>
        <p className="flex items-center gap-2 text-sm text-white/80">
          {mail.sharedBy && <Avatar name={mail.sharedBy.name} path={mail.sharedBy.avatar} className="h-6 w-6 text-[10px]" />}
          <span>
            Delt av <span className="font-semibold text-white">{mail.sharedBy?.name ?? 'et medlem'}</span>
          </span>
          <span className="text-xs text-white/40">{formatDate(mail.sharedAt)}</span>
        </p>
        {mail.note && <p className="whitespace-pre-wrap text-sm text-white/70">{mail.note}</p>}
      </div>

      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-white">{mail.subject || '(uten emne)'}</h2>
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white">{senderName(mail.from)}</span>
          {mail.from?.name && <span className="text-white/50"> &lt;{mail.from.address}&gt;</span>}
        </p>
        <p className="text-xs text-white/50">Til: {people(mail.to) || '—'}</p>
        {mail.cc.length > 0 && <p className="text-xs text-white/50">Kopi: {people(mail.cc)}</p>}
        <p className="text-xs text-white/40">{formatDate(mail.date)}</p>
      </header>

      {/* Pictures from other sites were left out when it was shared */}
      <MailFrame html={mail.html} allowImages={false} title={mail.subject || 'Delt mail'} />

      {mail.attachments.length > 0 && (
        <section aria-label="Vedlegg" className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80">Vedlegg</h3>
          <ul className="flex flex-wrap gap-2">
            {mail.attachments.map(attachment => (
              <li key={attachment.n}>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    downloadSharedAttachment(token, mail.id, attachment).catch(err => setError(errorMessage(err)))
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
          {error && <p className={ERROR_TEXT}>{error}</p>}
        </section>
      )}
    </article>
  )
}

export default SharedView
