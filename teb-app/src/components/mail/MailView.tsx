import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { conversationSummary, type Folder, type Label, type MailSummary } from '../../lib/mail'
import LabelChips from './LabelChips'
import MailActions, { type MailActionHandlers } from './MailActions'
import MailMessageCard from './MailMessageCard'

interface MailViewProps extends MailActionHandlers {
  token: string
  // The mails of the conversation, oldest first
  messages: MailSummary[]
  // The list the conversation was opened from, which Back returns to
  folder: string
  search: string
  folders: Folder[]
  labels: Label[]
  busy: boolean
  // The mails of the conversation that the buttons apply to
  actedOn: MailSummary[]
}

// A conversation: the buttons that act on all of it, then its mails one under the other
const MailView = ({ token, messages, folder, search, folders, labels, busy, actedOn, ...actions }: MailViewProps) => {
  const summary = conversationSummary(actedOn)

  return (
    <article className="space-y-4 p-4">
      <Link to={`/mail/${encodeURIComponent(folder)}${search}`} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white lg:hidden">
        <ArrowLeft size={16} aria-hidden="true" />
        Tilbake
      </Link>

      <MailActions token={token} mails={[summary]} folders={folders} labels={labels} current={summary.folder} disabled={busy} {...actions} />

      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-white">{messages[0].subject || '(uten emne)'}</h2>
        {messages.length > 1 && <p className="text-xs text-white/50">{messages.length} mails i samtalen</p>}
        <LabelChips ids={summary.labels} labels={labels} className="pt-1" />
      </header>

      <div className="space-y-3">
        {messages.map((mail, index) => (
          // Mails that were unread when the conversation was opened, and the newest, start out open
          <MailMessageCard key={mail.id} token={token} mail={mail} defaultOpen={index === messages.length - 1 || !mail.seen} />
        ))}
      </div>
    </article>
  )
}

export default MailView
