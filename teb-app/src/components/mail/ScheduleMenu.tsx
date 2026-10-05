import { CalendarClock, ChevronDown } from 'lucide-react'
import type { OfflineStatus } from '../../lib/mail'
import { BUTTON_GHOST, BUTTON_PRIMARY } from '../feed/styles'
import PopoverMenu from './PopoverMenu'
import TimeChoices from './TimeChoices'

interface ScheduleMenuProps {
  status: OfflineStatus
  disabled: boolean
  onSchedule: (when: Date) => void
  // Sends the member to the login provider to say yes. The mail is saved as a draft first.
  onConsent: () => void
  // The arrow on the right of the Send button, instead of a button of its own
  split?: boolean
}

// "Send senere": picks a time, or first explains the permission it needs
const ScheduleMenu = ({ status, disabled, onSchedule, onConsent, split }: ScheduleMenuProps) => (
  <PopoverMenu
    label="Send senere"
    width={288}
    trigger={({ onClick, open }) =>
      split ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Send senere"
          title="Send senere"
          className="inline-flex h-full cursor-pointer items-center rounded-r-md border-l border-white/30 bg-teb-orange px-2 text-white transition-colors hover:bg-teb-orange-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className={BUTTON_GHOST} onClick={onClick} disabled={disabled} aria-haspopup="menu" aria-expanded={open}>
          <CalendarClock size={16} aria-hidden="true" />
          Send senere
        </button>
      )
    }
  >
    {close =>
      status.enabled ? (
        <TimeChoices
          onChoose={when => {
            close()
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
      )
    }
  </PopoverMenu>
)

export default ScheduleMenu
