import { useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { ACTION, MENU, MENU_ITEM } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'
import TimeChoices from './TimeChoices'

interface SnoozeMenuProps {
  // True when the mails are in Snoozed already, where the menu can also take snoozing off
  snoozed: boolean
  onSnooze: (until: string | null) => void
}

const SnoozeMenu = ({ snoozed, onSnooze }: SnoozeMenuProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useDismiss(rootRef, open, () => setOpen(false))

  const choose = (until: string | null) => {
    setOpen(false)
    onSnooze(until)
  }

  return (
    <div ref={rootRef} className="relative">
      <button type="button" className={ACTION} onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Utsett" title="Utsett">
        <Clock size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Utsett</span>
      </button>
      {open && (
        <div role="menu" className={`${MENU} left-0 top-[calc(100%+4px)] w-64`}>
          {snoozed && (
            <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => choose(null)}>
              Fjern utsettelsen
            </button>
          )}
          <TimeChoices onChoose={until => choose(until.toISOString())} submitLabel="Utsett" inputId="snooze-until" />
        </div>
      )}
    </div>
  )
}

export default SnoozeMenu
