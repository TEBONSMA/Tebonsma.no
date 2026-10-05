import { Link } from 'react-router-dom'
import { Forward, Paperclip, Reply, Star } from 'lucide-react'
import { listDate, senderName, type Label, type MailSummary } from '../../lib/mail'
import { cn } from '../../lib/utils'
import { BUTTON_GHOST, ERROR_TEXT } from '../feed/styles'
import LabelChips from './LabelChips'

interface MailListProps {
  // Where the links go. A mail found in a list that spans folders still opens under that list.
  folder: string
  // The search and filters of the list, kept in the link so Back finds the list as it was
  search: string
  messages: MailSummary[] | null
  labels: Label[]
  error: string | null
  selected: string | undefined
  checked: Set<string>
  onToggle: (id: string) => void
  onToggleStar: (mail: MailSummary) => void
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onRetry: () => void
  // A draft is opened for writing instead of for reading
  onOpenDraft: ((mail: MailSummary) => void) | null
  // Mails that can be ticked and starred. The ones shared by others can't.
  selectable?: boolean
}

// Mails the member sent, kept as drafts or has scheduled are listed by who they went to
const OUTGOING = new Set(['sent', 'drafts', 'scheduled'])

const MailList = ({
  folder,
  search,
  messages,
  labels,
  error,
  selected,
  checked,
  onToggle,
  onToggleStar,
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
  onOpenDraft,
  selectable = true,
}: MailListProps) => {
  if (error) {
    return (
      <div className="space-y-3 p-4">
        <p className={ERROR_TEXT}>{error}</p>
        <button type="button" className={BUTTON_GHOST} onClick={onRetry}>
          Prøv igjen
        </button>
      </div>
    )
  }
  if (messages === null) return <p className="p-4 text-sm text-white/50">Laster mail…</p>
  if (messages.length === 0) return <p className="p-6 text-center text-sm text-white/50">Ingen mail her</p>

  return (
    <>
      <ul>
        {messages.map(mail => {
          // A conversation is listed by the people in it, a single mail by who wrote it or who it went to
          const who =
            mail.count > 1
              ? mail.participants.map(p => senderName(p).split(' ')[0]).join(', ')
              : OUTGOING.has(mail.folder)
                ? mail.to.map(senderName).join(', ') || 'Ingen mottaker'
                : senderName(mail.from)
          const row = (
            <>
              <span className="flex items-center gap-2">
                {!mail.seen && <span className="h-2 w-2 shrink-0 rounded-full bg-teb-orange" aria-label="Ulest" />}
                <span className={cn('min-w-0 flex-1 truncate text-sm', mail.seen ? 'text-white/70' : 'font-semibold text-white')}>
                  {who}
                  {mail.count > 1 && (
                    <span className="ml-1.5 text-xs font-normal text-white/40" aria-label={`${mail.count} mails`}>
                      {mail.count}
                    </span>
                  )}
                </span>
                {mail.answered && <Reply size={14} aria-label="Besvart" className="shrink-0 text-white/40" />}
                {mail.forwarded && <Forward size={14} aria-label="Videresendt" className="shrink-0 text-white/40" />}
                {mail.hasAttachments && <Paperclip size={14} aria-label="Har vedlegg" className="shrink-0 text-white/50" />}
                <span className="shrink-0 text-xs text-white/40">{mail.folder === 'scheduled' ? `Sendes ${listDate(mail.date)}` : listDate(mail.date)}</span>
              </span>
              <span className={cn('block truncate text-sm', mail.seen ? 'text-white/60' : 'font-medium text-white/90')}>
                {mail.subject || '(uten emne)'}
              </span>
              <span className="block truncate text-xs text-white/40">{mail.preview}</span>
              <LabelChips ids={mail.labels} labels={labels} className="mt-1" />
            </>
          )
          return (
            <li
              key={mail.id}
              className={cn(
                'flex items-start gap-2 border-b border-white/5 pl-3 transition-colors hover:bg-white/5',
                mail.id === selected && 'bg-white/10',
                checked.has(mail.id) && 'bg-teb-orange/10',
              )}
            >
              {selectable ? (
                <>
                  <input
                    type="checkbox"
                    checked={checked.has(mail.id)}
                    onChange={() => onToggle(mail.id)}
                    aria-label={`Velg «${mail.subject || 'uten emne'}»`}
                    className="mt-3.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-teb-orange)]"
                  />
                  <button
                    type="button"
                    onClick={() => onToggleStar(mail)}
                    aria-pressed={mail.flagged}
                    aria-label={mail.flagged ? 'Fjern favoritt' : 'Gjør til favoritt'}
                    className="mt-3 shrink-0 cursor-pointer text-white/30 transition-colors hover:text-amber-300"
                  >
                    <Star size={16} aria-hidden="true" className={mail.flagged ? 'fill-amber-300 text-amber-300' : undefined} />
                  </button>
                </>
              ) : (
                <span className="w-1 shrink-0" />
              )}
              {onOpenDraft ? (
                <button type="button" onClick={() => onOpenDraft(mail)} className="block min-w-0 flex-1 cursor-pointer py-2.5 pr-3 text-left">
                  {row}
                </button>
              ) : (
                <Link
                  to={`/mail/${encodeURIComponent(folder)}/${encodeURIComponent(mail.id)}${search}`}
                  aria-current={mail.id === selected ? 'true' : undefined}
                  className="block min-w-0 flex-1 py-2.5 pr-3"
                >
                  {row}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <div className="p-3 text-center">
          <button type="button" className={BUTTON_GHOST} onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Laster…' : 'Vis flere'}
          </button>
        </div>
      )}
    </>
  )
}

export default MailList
