import { Clock } from 'lucide-react'
import { ACTION, MENU_ITEM } from '../feed/styles'
import PopoverMenu from './PopoverMenu'
import TimeChoices from './TimeChoices'

interface SnoozeMenuProps {
  // True when the mails are in Snoozed already, where the menu can also take snoozing off
  snoozed: boolean
  onSnooze: (until: string | null) => void
}

const SnoozeMenu = ({ snoozed, onSnooze }: SnoozeMenuProps) => (
  <PopoverMenu
    label="Utsett"
    width={256}
    trigger={({ onClick, open }) => (
      <button type="button" className={ACTION} onClick={onClick} aria-haspopup="menu" aria-expanded={open} aria-label="Utsett" title="Utsett">
        <Clock size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Utsett</span>
      </button>
    )}
  >
    {close => (
      <>
        {snoozed && (
          <button
            type="button"
            role="menuitem"
            className={MENU_ITEM}
            onClick={() => {
              close()
              onSnooze(null)
            }}
          >
            Fjern utsettelsen
          </button>
        )}
        <TimeChoices
          onChoose={until => {
            close()
            onSnooze(until.toISOString())
          }}
          submitLabel="Utsett"
          inputId="snooze-until"
        />
      </>
    )}
  </PopoverMenu>
)

export default SnoozeMenu
