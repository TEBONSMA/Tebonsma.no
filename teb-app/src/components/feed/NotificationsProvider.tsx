import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getNotifications, markNotificationsRead, type Notification } from '../../lib/feed'
import { NotificationsContext } from './NotificationsContext'

const POLL_MS = 60_000

interface Loaded {
  items: Notification[]
  unread: number
  mailUnread: number
}

const NONE: Loaded = { items: [], unread: 0, mailUnread: 0 }

// Asks about notifications once a minute while the site is open, and shares the answer: the bell
// shows the notifications and the menu shows how many mails are unread. Both come from the same answer.
const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const token = user?.access_token
  const [loaded, setLoaded] = useState<Loaded>(NONE)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!token) return
    let active = true
    const load = () => {
      if (document.hidden) return
      getNotifications(token)
        .then(result => active && setLoaded({ items: result.items, unread: result.unread, mailUnread: result.mailUnread }))
        .catch(() => {}) // Tried again on the next round
    }
    load()
    const timer = setInterval(load, POLL_MS)
    document.addEventListener('visibilitychange', load)
    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', load)
    }
    // round changes when something asks for an extra look
  }, [token, round])

  const refresh = useCallback(() => setRound(n => n + 1), [])

  const markRead = (ids?: string[]) => {
    if (!token) return
    const isRead = (item: Notification) => item.read || !ids || ids.includes(item.id)
    setLoaded(current => ({
      ...current,
      unread: current.items.filter(item => !isRead(item)).length,
      items: current.items.map(item => ({ ...item, read: isRead(item) })),
    }))
    markNotificationsRead(token, ids).catch(() => {})
  }

  // Someone who isn't logged in has nothing to be told
  const value = token ? { ...loaded, markRead, refresh } : { ...NONE, markRead, refresh }
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export default NotificationsProvider
