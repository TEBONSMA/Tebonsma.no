import { Link } from 'react-router-dom'
import { ArrowLeft, Forward, Reply, ReplyAll } from 'lucide-react'
import { conversationSummary, type ComposeMode, type Folder, type Label, type MailSummary } from '../../lib/mail'
import { BUTTON_GHOST } from '../feed/styles'
import LabelChips from './LabelChips'
import MailActions, { type MailActionHandlers } from './MailActions'
import MailMessageCard from './MailMessageCard'
import ScheduledBar from './ScheduledBar'

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
  // Starts a reply to the newest mail of the conversation, or forwards it
  onCompose: (mode: Exclude<ComposeMode, 'draft'>) => void
  // Set for a mail in Planlagt, which can be given a new time or taken back for editing instead of being answered
  scheduled: { sendAt: string | null; onReschedule: (when: Date) => void; onEdit: () => void } | null
}

// A conversation: the buttons that act on all of it, then its mails one under the other
const MailView = ({ token, messages, folder, search, folders, labels, busy, actedOn, onCompose, scheduled, ...actions }: MailViewProps) => {
  const summary = conversationSummary(actedOn)

  return (
    <article className="space-y-4 p-4">
      <Link to={`/mail/${encodeURIComponent(folder)}${search}`} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white lg:hidden">
        <ArrowLeft size={16} aria-hidden="true" />
        Tilbake
      </Link>

      {scheduled ? (
        <ScheduledBar sendAt={scheduled.sendAt} busy={busy} onReschedule={scheduled.onReschedule} onEdit={scheduled.onEdit} />
      ) : (
        <>
          <MailActions token={token} mails={[summary]} folders={folders} labels={labels} current={summary.folder} disabled={busy} {...actions} />

          <div className="flex flex-wrap gap-2">
            <button type="button" className={BUTTON_GHOST} onClick={() => onCompose('reply')}>
              <Reply size={16} aria-hidden="true" />
              Svar
            </button>
            <button type="button" className={BUTTON_GHOST} onClick={() => onCompose('replyAll')}>
              <ReplyAll size={16} aria-hidden="true" />
              Svar alle
            </button>
            <button type="button" className={BUTTON_GHOST} onClick={() => onCompose('forward')}>
              <Forward size={16} aria-hidden="true" />
              Videresend
            </button>
          </div>

        </>
      )}

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
