import { useRef, useState } from 'react'
import { CalendarPlus, Download, ExternalLink } from 'lucide-react'
import { canExport, downloadEvent, googleCalendarUrl, type ExportableEvent } from '../../lib/calendarExport'
import { BUTTON_GHOST, MENU, MENU_ITEM } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'

// Puts a dated event in the member's own calendar: Google's opens with the event filled in,
// the others get a file to open
const AddToCalendar = ({ post }: { post: ExportableEvent }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, open, () => setOpen(false))

  if (!canExport(post)) return null
  const googleUrl = googleCalendarUrl(post)
  if (!googleUrl) return null

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        className={`${BUTTON_GHOST} px-3 py-1.5`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <CalendarPlus size={16} aria-hidden="true" />
        Legg til i kalender
      </button>
      {open && (
        <div role="menu" className={`${MENU} left-0 top-[calc(100%+4px)] w-60`}>
          <a
            role="menuitem"
            className={MENU_ITEM}
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={16} aria-hidden="true" />
            Google Kalender
          </a>
          <button
            type="button"
            role="menuitem"
            className={MENU_ITEM}
            onClick={() => {
              downloadEvent(post)
              setOpen(false)
            }}
          >
            <Download size={16} aria-hidden="true" />
            Apple Kalender / iCal
          </button>
        </div>
      )}
    </div>
  )
}

export default AddToCalendar
