import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import Avatar from '../Avatar'
import { useAuth } from '../../auth/AuthContext'
import { getNotifications, markNotificationsRead, timeAgo, type Notification } from '../../lib/feed'
import { MENU } from './styles'
import { useDismiss } from './useDismiss'

const POLL_MS = 60_000

const TEXT: Record<Notification['kind'], string> = {
  comment: 'kommenterte innlegget ditt',
  reply: 'svarte på kommentaren din',
  event: 'publiserte et arrangement',
  announcement: 'sendte en kunngjøring',
}

// Tells members when someone comments on their post or answers their comment, and about
// new events and what their organizers announce
const NotificationBell = () => {
  const { user } = useAuth()
  const token = user?.access_token
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  useDismiss(rootRef, open, () => setOpen(false))

  useEffect(() => {
    if (!token) return
    let active = true
    const refresh = () => {
      if (document.hidden) return
      getNotifications(token)
        .then(loaded => {
          if (!active) return
          setItems(loaded.items)
          setUnread(loaded.unread)
        })
        .catch(() => {}) // Tried again on the next round
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [token])

  if (!token) return null

  const markRead = (ids?: string[]) => {
    const isRead = (item: Notification) => item.read || !ids || ids.includes(item.id)
    setUnread(items.filter(item => !isRead(item)).length)
    setItems(items.map(item => ({ ...item, read: isRead(item) })))
    markNotificationsRead(token, ids).catch(() => {})
  }

  const openItem = (item: Notification) => {
    setOpen(false)
    if (!item.read) markRead([item.id])
    navigate(`/feed/${item.postId}`)
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
                    <Avatar name={item.actor.name} path={item.actor.avatar} className="mt-0.5 h-8 w-8 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white/80">
                        <span className="font-semibold text-white">{item.actor.name}</span> {TEXT[item.kind]}
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
        </div>
      )}
    </div>
  )
}

export default NotificationBell
