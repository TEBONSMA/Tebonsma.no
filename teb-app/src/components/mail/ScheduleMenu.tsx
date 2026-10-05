import { useRef, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import type { OfflineStatus } from '../../lib/mail'
import { BUTTON_GHOST, BUTTON_PRIMARY, MENU } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'
import TimeChoices from './TimeChoices'

interface ScheduleMenuProps {
  status: OfflineStatus
  disabled: boolean
  onSchedule: (when: Date) => void
  // Sends the member to the login provider to say yes. The mail is saved as a draft first.
  onConsent: () => void
}

// "Send senere": picks a time, or first explains the permission it needs
const ScheduleMenu = ({ status, disabled, onSchedule, onConsent }: ScheduleMenuProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useDismiss(rootRef, open, () => setOpen(false))

  return (
    <div ref={rootRef} className="relative">
      <button type="button" className={BUTTON_GHOST} onClick={() => setOpen(o => !o)} disabled={disabled} aria-haspopup="menu" aria-expanded={open}>
        <CalendarClock size={16} aria-hidden="true" />
        Send senere
      </button>
      {open && (
        <div role="menu" className={`${MENU} bottom-[calc(100%+4px)] left-0 w-72`}>
          {status.enabled ? (
            <TimeChoices
              onChoose={when => {
                setOpen(false)
                onSchedule(when)
              }}
              submitLabel="Planlegg"
              inputId="schedule-at"
            />
          ) : (
            <div className="space-y-3 p-3 text-sm text-white/70">
              <p>
                For å sende mailen når du er logget ut, må tebonsma.no få lov til å hente et nytt innlogging for deg. Det lagres kryptert, og du kan trekke tillatelsen når som helst under
                «Autosvar og innstillinger».
              </p>
              <p>Mailen lagres i Kladder først, så du finner den igjen når du kommer tilbake.</p>
              <button type="button" className={`${BUTTON_PRIMARY} w-full`} onClick={onConsent}>
                Gi tillatelse
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScheduleMenu
