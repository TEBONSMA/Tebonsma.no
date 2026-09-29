import { createContext, useContext } from 'react'
import type { ApiError, Profile } from '../lib/api'

export interface ProfileState {
  profile: Profile | null
  error: ApiError | null
  retry: () => void
  setProfile: (profile: Profile) => void
}

export const ProfileContext = createContext<ProfileState | null>(null)

export function useProfile() {
  const state = useContext(ProfileContext)
  if (!state) throw new Error('useProfile must be used inside <ProfileProvider>')
  return state
}
