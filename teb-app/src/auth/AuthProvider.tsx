import { useEffect, useState, type ReactNode } from 'react'
import type { User } from 'oidc-client-ts'
import { AuthContext } from './AuthContext'
import { AUTHORITY, userManager } from './userManager'

const login = () => {
  const { pathname, search, hash } = window.location
  return userManager.signinRedirect({ state: { returnTo: pathname + search + hash } })
}

const logout = async () => {
  try {
    await userManager.revokeTokens()
  } catch {
    // Tokens may already be expired or revoked; clearing locally is what matters
  }
  await userManager.removeUser()
  // Authelia has no end_session_endpoint, so end the SSO session through its portal
  window.location.assign(`${AUTHORITY}/logout?rd=${encodeURIComponent(`${window.location.origin}/`)}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    userManager.getUser().then(stored => {
      if (!active) return
      setUser(stored && !stored.expired ? stored : null)
      setIsLoading(false)
    })

    const onLoaded = (loaded: User) => setUser(loaded)
    const onGone = () => setUser(null)
    userManager.events.addUserLoaded(onLoaded)
    userManager.events.addUserUnloaded(onGone)
    userManager.events.addAccessTokenExpired(onGone)

    return () => {
      active = false
      userManager.events.removeUserLoaded(onLoaded)
      userManager.events.removeUserUnloaded(onGone)
      userManager.events.removeAccessTokenExpired(onGone)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
