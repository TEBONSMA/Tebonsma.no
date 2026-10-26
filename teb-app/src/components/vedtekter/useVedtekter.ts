import { useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { errorMessage } from '../../lib/feed'
import { getVedtekter, type Vedtekter } from '../../lib/vedtekter'

// The vedtekter are the same on every page here, so they are fetched once per visit
let cached: Vedtekter | null = null

export function useVedtekter(token: string | null) {
  const [document, setDocument] = useState<Vedtekter | null>(cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || cached) return
    let active = true
    getVedtekter(token)
      .then(loaded => {
        cached = loaded
        if (active) setDocument(loaded)
      })
      .catch(err => {
        if (active) setError(err instanceof ApiError && err.status === 404 ? 'Vedtektene er ikke lagt ut ennå.' : errorMessage(err))
      })
    return () => {
      active = false
    }
  }, [token])

  return { document, error }
}
