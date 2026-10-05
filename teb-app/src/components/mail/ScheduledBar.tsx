import { useRef, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { formatDate } from '../../lib/feed'
import { BUTTON_GHOST, CARD, MENU } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'
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
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useDismiss(rootRef, open, () => setOpen(false))

  return (
    <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-3`}>
      <p className="inline-flex items-center gap-2 text-sm text-white/80">
        <CalendarClock size={16} aria-hidden="true" />
        {sendAt ? `Sendes ${formatDate(sendAt)}` : 'Venter på å bli sendt'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div ref={rootRef} className="relative">
          <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}>
            Endre tidspunkt
          </button>
          {open && (
            <div role="menu" className={`${MENU} right-0 top-[calc(100%+4px)] w-64`}>
              <TimeChoices
                onChoose={when => {
                  setOpen(false)
                  onReschedule(when)
                }}
                submitLabel="Planlegg på nytt"
                inputId="reschedule-at"
              />
            </div>
          )}
        </div>
        <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={onEdit}>
          Avbryt og rediger
        </button>
      </div>
    </div>
  )
}

export default ScheduledBar
