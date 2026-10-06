import { Archive, Mail, MailOpen, RotateCcw, ShieldAlert, Star, Trash, Trash2 } from 'lucide-react'
import type { Folder, Label, MailSummary } from '../../lib/mail'
import { ACTION } from '../feed/styles'
import LabelMenu from './LabelMenu'
import MoveMenu from './MoveMenu'
import SnoozeMenu from './SnoozeMenu'

export interface MailActionHandlers {
  onFlags: (change: { seen?: boolean; flagged?: boolean }) => void
  onLabels: (add: string[], remove: string[]) => void
  onMove: (folder: string) => void
  onRestore: () => void
  // A time to bring the mails back at, or null to take snoozing off
  onSnooze: (until: string | null) => void
  onDeleteForever: () => void
  onLabelCreated: () => void
}

interface MailActionsProps extends MailActionHandlers {
  token: string
  // The mails the actions apply to: one open mail, or the selection in the list
  mails: MailSummary[]
  folders: Folder[]
  labels: Label[]
  // The folder the member is looking at
  current: string
  disabled?: boolean
}

// What can be done with one or more mails. The same buttons serve a single open mail and a selection.
const MailActions = ({ token, mails, folders, labels, current, disabled, ...on }: MailActionsProps) => {
  if (mails.length === 0) return null
  const everyIn = (folder: string) => mails.every(mail => mail.folder === folder)
  const inTrash = everyIn('trash')
  const anyUnread = mails.some(mail => !mail.seen)
  const allFlagged = mails.every(mail => mail.flagged)

  return (
    <div className="flex flex-wrap items-center gap-0.5" aria-busy={disabled}>
      {inTrash ? (
        <>
          <button type="button" className={ACTION} disabled={disabled} onClick={on.onRestore} title="Gjenopprett">
            <RotateCcw size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Gjenopprett</span>
          </button>
          <button type="button" className={ACTION} disabled={disabled} onClick={on.onDeleteForever} title="Slett for godt">
            <Trash size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Slett for godt</span>
          </button>
        </>
      ) : (
        <>
          {!everyIn('archive') && (
            <button type="button" className={ACTION} disabled={disabled} onClick={() => on.onMove('archive')} title="Arkiver">
              <Archive size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Arkiver</span>
            </button>
          )}
          <button type="button" className={ACTION} disabled={disabled} onClick={() => on.onMove('trash')} title="Slett">
            <Trash2 size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Slett</span>
          </button>
          {!everyIn('junk') && (
            <button type="button" className={ACTION} disabled={disabled} onClick={() => on.onMove('junk')} title="Merk som søppelpost">
              <ShieldAlert size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Søppelpost</span>
            </button>
          )}
        </>
      )}
      <button type="button" className={ACTION} disabled={disabled} onClick={() => on.onFlags({ seen: anyUnread })} title={anyUnread ? 'Merk som lest' : 'Merk som ulest'}>
        {anyUnread ? <MailOpen size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
        <span className="hidden sm:inline">{anyUnread ? 'Merk som lest' : 'Merk som ulest'}</span>
      </button>
      <button type="button" className={ACTION} disabled={disabled} onClick={() => on.onFlags({ flagged: !allFlagged })} title={allFlagged ? 'Fjern favoritt' : 'Gjør til favoritt'}>
        <Star size={16} aria-hidden="true" className={allFlagged ? 'fill-amber-300 text-amber-300' : undefined} />
        <span className="hidden sm:inline">{allFlagged ? 'Fjern favoritt' : 'Favoritt'}</span>
      </button>
      <LabelMenu token={token} labels={labels} mails={mails} onChange={on.onLabels} onCreated={on.onLabelCreated} />
      {!inTrash && <SnoozeMenu snoozed={everyIn('snoozed')} onSnooze={on.onSnooze} />}
      {!inTrash && <MoveMenu folders={folders} current={current} onMove={on.onMove} />}
    </div>
  )
}

export default MailActions
