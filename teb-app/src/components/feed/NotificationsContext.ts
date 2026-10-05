import { createContext, useContext } from 'react'
import type { Notification } from '../../lib/feed'

export interface NotificationsState {
  items: Notification[]
  unread: number
  // Unread mails in the inbox, for the number next to Mail in the menu
  mailUnread: number
  // Marks some as read, or all of them without ids
  markRead: (ids?: string[]) => void
  // Looks again now, instead of waiting for the next round
  refresh: () => void
}

export const NotificationsContext = createContext<NotificationsState | null>(null)

export function useNotifications() {
  const state = useContext(NotificationsContext)
  if (!state) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return state
}
