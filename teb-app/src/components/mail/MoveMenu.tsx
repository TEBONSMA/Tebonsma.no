import { useRef, useState } from 'react'
import { FolderInput } from 'lucide-react'
import type { Folder } from '../../lib/mail'
import { ACTION, MENU, MENU_ITEM } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'

// Folders mails can be moved to by hand. Drafts, snoozed and scheduled have their own ways in.
const NOT_MOVABLE = new Set(['drafts', 'snoozed', 'scheduled'])

interface MoveMenuProps {
  folders: Folder[]
  // Where the mails are now, so it isn't offered
  current: string
  onMove: (folder: string) => void
}

const MoveMenu = ({ folders, current, onMove }: MoveMenuProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useDismiss(rootRef, open, () => setOpen(false))
  const targets = folders.filter(f => !(f.role && NOT_MOVABLE.has(f.role)) && f.key !== current)

  return (
    <div ref={rootRef} className="relative">
      <button type="button" className={ACTION} onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Flytt til" title="Flytt til">
        <FolderInput size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Flytt</span>
      </button>
      {open && (
        <div role="menu" className={`${MENU} left-0 top-[calc(100%+4px)] w-52`}>
          <ul className="max-h-72 overflow-y-auto">
            {targets.map(folder => (
              <li key={folder.key}>
                <button
                  type="button"
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => {
                    setOpen(false)
                    onMove(folder.key)
                  }}
                >
                  {folder.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default MoveMenu
