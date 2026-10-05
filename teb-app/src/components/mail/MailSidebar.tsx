import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  CalendarClock,
  Clock,
  FileText,
  Folder as FolderIcon,
  Inbox,
  Pencil,
  Settings,
  Share2,
  Plus,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  X,
  Mail,
  type LucideIcon,
} from 'lucide-react'
import { errorMessage } from '../../lib/feed'
import { createFolder, deleteLabel, type Folder, type Label, type Role, type SharedCount } from '../../lib/mail'
import { cn } from '../../lib/utils'
import { BUTTON_PRIMARY, ERROR_TEXT, INPUT } from '../feed/styles'
import { LABEL_DOT } from './labelStyles'

const ICONS: Record<Role, LucideIcon> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  archive: Archive,
  junk: ShieldAlert,
  trash: Trash2,
  snoozed: Clock,
  scheduled: CalendarClock,
}

// Snoozed and scheduled mail only gets a folder in the list once there is something in it
const WHEN_NOT_EMPTY = new Set<Role>(['snoozed', 'scheduled'])
// Where unread mail from other folders is counted for "Uleste"
const UNREAD_FROM = new Set<Role>(['inbox', 'archive'])

interface MailSidebarProps {
  token: string
  folders: Folder[] | null
  labels: Label[]
  shared: SharedCount
  // The list being looked at, and the label if it is one
  active: string
  activeLabel: string | undefined
  // Something about folders or labels changed, so they should be fetched again
  onChanged: () => void
  onNavigate: () => void
  onCompose: () => void
}

const ITEM = 'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors'

interface EntryProps {
  to: string
  icon: LucideIcon
  name: string
  count?: number
  active: boolean
  onNavigate: () => void
}

const Entry = ({ to, icon: Icon, name, count = 0, active, onNavigate }: EntryProps) => (
  <Link
    to={to}
    onClick={onNavigate}
    aria-current={active ? 'page' : undefined}
    className={cn(ITEM, active ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')}
  >
    <Icon size={16} aria-hidden="true" className="shrink-0" />
    <span className="min-w-0 flex-1 truncate">{name}</span>
    {count > 0 && (
      <span className="rounded-full bg-teb-orange px-1.5 text-[11px] font-bold text-white" aria-label={`${count} uleste`}>
        {count}
      </span>
    )}
  </Link>
)

const MailSidebar = ({ token, folders, labels, shared, active, activeLabel, onChanged, onNavigate, onCompose }: MailSidebarProps) => {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadTotal = (folders ?? []).filter(f => f.role === null || UNREAD_FROM.has(f.role)).reduce((sum, f) => sum + f.unseen, 0)
  const own = (folders ?? []).filter(f => f.role === null)
  const roles = (folders ?? []).filter(f => f.role !== null && (!WHEN_NOT_EMPTY.has(f.role) || f.total > 0))
  const link = (key: string) => `/mail/${encodeURIComponent(key)}`

  const addFolder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = String(new FormData(e.currentTarget).get('name') ?? '').trim()
    if (!name) return
    setError(null)
    try {
      await createFolder(token, name)
      setAdding(false)
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const removeLabel = async (label: Label) => {
    if (!window.confirm(`Slette etiketten «${label.name}»? Mailene beholdes.`)) return
    try {
      await deleteLabel(token, label.id)
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <nav aria-label="Mapper" className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => {
          onNavigate()
          onCompose()
        }}
        className={`${BUTTON_PRIMARY} mb-2 w-full`}
      >
        <Pencil size={16} aria-hidden="true" />
        Ny mail
      </button>
      {folders === null && <p className="px-3 py-2 text-sm text-white/40">Laster mapper…</p>}

      {roles.slice(0, 1).map(folder => (
        <Entry key={folder.key} to={link(folder.key)} icon={ICONS[folder.role!]} name={folder.name} count={folder.unseen} active={active === folder.key && !activeLabel} onNavigate={onNavigate} />
      ))}
      {folders && (
        <>
          <Entry to={link('favorites')} icon={Star} name="Favoritter" active={active === 'favorites'} onNavigate={onNavigate} />
          <Entry to={link('unread')} icon={Mail} name="Uleste" count={unreadTotal} active={active === 'unread'} onNavigate={onNavigate} />
          <Entry to={link('shared')} icon={Share2} name="Delt med meg" count={shared.unseen} active={active === 'shared'} onNavigate={onNavigate} />
        </>
      )}
      {roles.slice(1).map(folder => (
        <Entry key={folder.key} to={link(folder.key)} icon={ICONS[folder.role!]} name={folder.name} count={folder.unseen} active={active === folder.key && !activeLabel} onNavigate={onNavigate} />
      ))}

      {folders && (
        <>
          <div className="mt-3 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            <span>Mine mapper</span>
            <button type="button" onClick={() => setAdding(a => !a)} aria-label="Ny mappe" aria-expanded={adding} className="cursor-pointer rounded p-1 hover:bg-white/10 hover:text-white">
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
          {adding && (
            <form onSubmit={addFolder} className="px-2 pb-1">
              <input name="name" className={INPUT} placeholder="Navn på mappen" maxLength={60} aria-label="Navn på ny mappe" autoFocus />
            </form>
          )}
          {own.map(folder => (
            <Entry key={folder.key} to={link(folder.key)} icon={FolderIcon} name={folder.name} count={folder.unseen} active={active === folder.key && !activeLabel} onNavigate={onNavigate} />
          ))}

          {labels.length > 0 && (
            <div className="mt-3 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">Etiketter</div>
          )}
          {labels.map(label => (
            <div key={label.id} className="group flex items-center">
              <Link
                to={`/mail/all?label=${label.id}`}
                onClick={onNavigate}
                aria-current={activeLabel === label.id ? 'page' : undefined}
                className={cn(ITEM, 'min-w-0 flex-1', activeLabel === label.id ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')}
              >
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', LABEL_DOT[label.color])} />
                <span className="min-w-0 flex-1 truncate">{label.name}</span>
              </Link>
              <button
                type="button"
                onClick={() => removeLabel(label)}
                aria-label={`Slett etiketten ${label.name}`}
                className="mr-1 cursor-pointer rounded p-1 text-white/30 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </>
      )}
      <Link to="/mail/autosvar" onClick={onNavigate} className={cn(ITEM, 'mt-3 text-white/60 hover:bg-white/5 hover:text-white')}>
        <Settings size={16} aria-hidden="true" className="shrink-0" />
        Autosvar og innstillinger
      </Link>
      {error && <p className={`${ERROR_TEXT} px-3 pt-2`}>{error}</p>}
    </nav>
  )
}

export default MailSidebar
