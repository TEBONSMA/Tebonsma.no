import { CalendarClock } from 'lucide-react'
import { formatDate } from '../../lib/feed'
import { BUTTON_GHOST, CARD } from '../feed/styles'
import PopoverMenu from './PopoverMenu'
import TimeChoices from './TimeChoices'

interface ScheduledBarProps {
  // When the mail will be sent, if the list knows
  sendAt: string | null
  busy: boolean
  onReschedule: (when: Date) => void
  // Takes the mail out of the schedule and opens it for writing
  onEdit: () => void
}

// What can be done with a mail that is waiting to be sent
const ScheduledBar = ({ sendAt, busy, onReschedule, onEdit }: ScheduledBarProps) => {
  return (
    <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-3`}>
      <p className="inline-flex items-center gap-2 text-sm text-white/80">
        <CalendarClock size={16} aria-hidden="true" />
        {sendAt ? `Sendes ${formatDate(sendAt)}` : 'Venter på å bli sendt'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PopoverMenu
          label="Endre tidspunkt"
          width={256}
          trigger={({ onClick, open }) => (
            <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={onClick} aria-haspopup="menu" aria-expanded={open}>
              Endre tidspunkt
            </button>
          )}
        >
          {close => (
            <TimeChoices
              onChoose={when => {
                close()
                onReschedule(when)
              }}
              submitLabel="Planlegg på nytt"
              inputId="reschedule-at"
            />
          )}
        </PopoverMenu>
        <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={onEdit}>
          Avbryt og rediger
        </button>
      </div>
    </div>
  )
}

export default ScheduledBar
