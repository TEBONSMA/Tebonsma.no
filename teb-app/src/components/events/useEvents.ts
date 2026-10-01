import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { listEvents, type EventPost } from '../../lib/events'
import { errorMessage } from '../../lib/feed'

interface Loaded {
  key: string
  events: EventPost[]
  error: string | null
}

// Every event the viewer can see. Members get the closed ones too, so the list is fetched
// again when someone logs in or out.
export function useEvents() {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  // What the list on screen was fetched for. Fetching it again keeps the key, so the list
  // stays up meanwhile.
  const key = token ? 'member' : 'visitor'
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (isLoading) return
    let active = true
    listEvents(token)
      .then(events => {
        if (active) setLoaded({ key, events, error: null })
      })
      .catch(err => {
        if (active) setLoaded({ key, events: [], error: errorMessage(err) })
      })
    return () => {
      active = false
    }
  }, [isLoading, token, key, attempt])

  return {
    events: current?.events ?? null,
    error: current?.error ?? null,
    // Fetched again rather than patched, so a new or changed event lands where its date puts it
    reload: () => setAttempt(n => n + 1),
  }
}
