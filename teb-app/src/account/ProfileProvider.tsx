import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError, apiFetch, type Profile } from '../lib/api'
import { ProfileContext } from './ProfileContext'

// Loads the logged-in member's profile from the account API once, so the header and
// the account page show the same name and picture and stay in sync after edits
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const token = user?.access_token
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token) return
    let active = true
    apiFetch<Profile>('/me', token)
      .then(loaded => {
        if (!active) return
        setProfile(loaded)
        setError(null)
      })
      .catch(err => {
        if (active) setError(err instanceof ApiError ? err : new ApiError(String(err), 0))
      })
    return () => {
      active = false
    }
  }, [token, attempt])

  const retry = () => {
    setError(null)
    setAttempt(a => a + 1)
  }

  return (
    <ProfileContext.Provider value={{ profile, error, retry, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}
