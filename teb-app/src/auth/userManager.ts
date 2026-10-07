import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// Can point at the API repo's mock login in local development (npm run dev:mock). Builds
// always use the real login server, so a stray setting can't send members anywhere else.
export const AUTHORITY = (
  (import.meta.env.DEV && import.meta.env.VITE_AUTH_AUTHORITY) || 'https://auth.tebonsma.no'
).replace(/\/$/, '')
// Authelia's own settings page has the change-password dialog
export const PASSWORD_URL = `${AUTHORITY}/settings/security`
// LLDAP's admin UI, still used for managing users and groups
export const USER_ADMIN_URL = 'https://konto.tebonsma.no'
export const ADMIN_GROUP = 'lldap_admin'

export const userManager = new UserManager({
  authority: AUTHORITY,
  client_id: 'tebonsma-web',
  redirect_uri: `${window.location.origin}/auth/callback`,
  // A silent login comes back to the same page, inside a hidden frame (see main.tsx)
  silent_redirect_uri: `${window.location.origin}/auth/callback`,
  response_type: 'code',
  // No offline_access: Authelia asks for consent on every login that requests it. The login is
  // renewed in a hidden frame instead, for as long as Authelia's own session lasts.
  scope: 'openid profile email groups',
  // Authelia leaves name, email and groups out of the ID token; they come from userinfo
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})
