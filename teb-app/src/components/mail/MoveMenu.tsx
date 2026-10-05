import { FolderInput } from 'lucide-react'
import type { Folder } from '../../lib/mail'
import { ACTION, MENU_ITEM } from '../feed/styles'
import PopoverMenu from './PopoverMenu'

// Folders mails can be moved to by hand. Drafts, snoozed and scheduled have their own ways in.
const NOT_MOVABLE = new Set(['drafts', 'snoozed', 'scheduled'])

interface MoveMenuProps {
  folders: Folder[]
  // Where the mails are now, so it isn't offered
  current: string
  onMove: (folder: string) => void
}

const MoveMenu = ({ folders, current, onMove }: MoveMenuProps) => {
  const targets = folders.filter(f => !(f.role && NOT_MOVABLE.has(f.role)) && f.key !== current)

  return (
    <PopoverMenu
      label="Flytt til"
      width={208}
      trigger={({ onClick, open }) => (
        <button type="button" className={ACTION} onClick={onClick} aria-haspopup="menu" aria-expanded={open} aria-label="Flytt til" title="Flytt til">
          <FolderInput size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Flytt</span>
        </button>
      )}
    >
      {close => (
        <ul>
          {targets.map(folder => (
            <li key={folder.key}>
              <button
                type="button"
                role="menuitem"
                className={MENU_ITEM}
                onClick={() => {
                  close()
                  onMove(folder.key)
                }}
              >
                {folder.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </PopoverMenu>
  )
}

export default MoveMenu
