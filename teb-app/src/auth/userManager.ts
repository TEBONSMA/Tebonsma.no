import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

export const AUTHORITY = 'https://auth.tebonsma.no'
export const ACCOUNT_URL = 'https://konto.tebonsma.no'

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
