import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Mail, MailWarning } from 'lucide-react'
import Avatar from '../Avatar'
import { useAuth } from '../../auth/AuthContext'
import { timeAgo, type Notification } from '../../lib/feed'
import { MENU } from './styles'
import { useDismiss } from './useDismiss'
import { useNotifications } from './NotificationsContext'
import PushSetting from './PushSetting'

const TEXT: Record<Notification['kind'], string> = {
  comment: 'kommenterte innlegget ditt',
  reply: 'svarte på kommentaren din',
  event: 'publiserte et arrangement',
  announcement: 'sendte en kunngjøring',
  mail: 'sendte deg en mail',
  mail_share: 'delte en mail med deg',
  mail_failed: 'En planlagt mail ble ikke sendt. Den ligger i Kladder.',
}

// Where a notification leads: the post or the mail it is about
const targetOf = (item: Notification) => {
  if (item.kind === 'mail') return item.mailId ? `/mail/inbox/${encodeURIComponent(item.mailId)}` : '/mail'
  if (item.kind === 'mail_share') return item.mailId ? `/mail/shared/${encodeURIComponent(item.mailId)}` : '/mail/shared'
  if (item.kind === 'mail_failed') return '/mail/drafts'
  return `/feed/${item.postId}`
}

// Tells members when someone comments on their post or answers their comment, about new events
// and what their organizers announce, and about their mail: new mail, shared mail, and mail that
// was meant to be sent later and wasn't
const NotificationBell = () => {
  const { user } = useAuth()
  const token = user?.access_token
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { items, unread, markRead } = useNotifications()

  useDismiss(rootRef, open, () => setOpen(false))

  if (!token) return null

  const openItem = (item: Notification) => {
    setOpen(false)
    if (!item.read) markRead([item.id])
    navigate(targetOf(item))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Varsler, ${unread} uleste` : 'Varsler'}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/80 cursor-pointer transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-teb-orange px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className={`${MENU} right-0 top-[calc(100%+8px)] w-80 max-w-[calc(100vw-2rem)]`}>
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <p className="font-semibold text-white">Varsler</p>
            {unread > 0 && (
              <button type="button" className="text-xs text-white/60 cursor-pointer hover:text-white" onClick={() => markRead()}>
                Marker alle som lest
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-white/50">Ingen varsler ennå</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openItem(item)}
                    className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left cursor-pointer transition-colors hover:bg-white/10"
                  >
                    {item.actor ? (
                      <Avatar name={item.actor.name} path={item.actor.avatar} className="mt-0.5 h-8 w-8 text-xs" />
                    ) : (
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70" aria-hidden="true">
                        {item.kind === 'mail_failed' ? <MailWarning size={16} /> : <Mail size={16} />}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white/80">
                        {item.kind !== 'mail_failed' && <span className="font-semibold text-white">{item.actor?.name ?? (item.kind === 'mail' || item.kind === 'mail_share' ? item.sender : '')}</span>}{' '}
                        {TEXT[item.kind]}
                      </span>
                      <span className="block truncate text-sm text-white/50">{item.excerpt}</span>
                      <span className="block text-xs text-white/40">{timeAgo(item.createdAt)}</span>
                    </span>
                    {!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teb-orange" aria-label="Ulest" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <PushSetting token={token} />
        </div>
      )}
    </div>
  )
}

export default NotificationBell
