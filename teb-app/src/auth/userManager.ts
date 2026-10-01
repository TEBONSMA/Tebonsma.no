import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// Overridden in local development to point at the API repo's mock login (npm run dev:mock)
export const AUTHORITY = (import.meta.env.VITE_AUTH_AUTHORITY ?? 'https://auth.tebonsma.no').replace(/\/$/, '')
// Authelia's own settings page has the change-password dialog
export const PASSWORD_URL = `${AUTHORITY}/settings/security`
// LLDAP's admin UI, still used for managing users and groups
export const USER_ADMIN_URL = 'https://konto.tebonsma.no'
export const ADMIN_GROUP = 'lldap_admin'

export const userManager = new UserManager({
  authority: AUTHORITY,
  client_id: 'tebonsma-web',
  redirect_uri: `${window.location.origin}/auth/callback`,
  response_type: 'code',
  scope: 'openid profile email groups offline_access',
  // Authelia leaves name, email and groups out of the ID token; they come from userinfo
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})
