import type { User } from 'oidc-client-ts'

export const displayName = (user: User) =>
  user.profile.name || user.profile.preferred_username || 'Bruker'

export const initials = (name: string) => {
  const words = name.trim().split(/\s+/)
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 1)
  return letters.toUpperCase()
}
