import { apiFetch } from './api'

// Push notifications on this device. The browser subscribes through its own push service with
// the API's public key, the API pushes to it, and public/sw.js shows what arrives.

const SITE = 'teb'

// install: an iPhone or iPad, where only a site added to the Home Screen can get notifications
export type PushState = 'unsupported' | 'install' | 'denied' | 'off' | 'on'

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

async function currentSubscription() {
  if (!pushSupported()) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return isIos() && !isInstalled() ? 'install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' && (await currentSubscription()) ? 'on' : 'off'
}

const keyBytes = (base64url: string) => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)), char => char.charCodeAt(0))
}

const sameKey = (current: ArrayBuffer | null, key: Uint8Array) =>
  !!current && current.byteLength === key.length && new Uint8Array(current).every((byte, i) => byte === key[i])

const handIn = (token: string, subscription: PushSubscription) =>
  apiFetch('/push/subscriptions', token, { method: 'POST', body: JSON.stringify({ site: SITE, subscription }) })

// Must be called straight from a tap: an iPhone only asks for permission then
export async function turnOnPush(token: string) {
  const permission = await Notification.requestPermission()
  if (permission === 'denied') throw new Error('Varsler er blokkert for siden. Slå dem på i nettleserens innstillinger.')
  if (permission !== 'granted') throw new Error('Du må si ja til varsler for å få dem.')
  const { publicKey } = await apiFetch<{ publicKey: string | null }>('/push/key', token)
  if (!publicKey) throw new Error('Varsler er ikke slått på på serveren ennå.')
  const key = keyBytes(publicKey)
  const { pushManager } = await navigator.serviceWorker.ready
  let subscription = await pushManager.getSubscription()
  // One made with an older key of the API's can't receive anything now
  if (subscription && !sameKey(subscription.options.applicationServerKey, key)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  await handIn(token, subscription)
}

export async function turnOffPush(token: string) {
  const subscription = await currentSubscription()
  if (!subscription) return
  await apiFetch('/push/subscriptions', token, { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(() => {})
  await subscription.unsubscribe()
}

// Hands this device's subscription in again when a member logs in, so the API has it, for them
export async function renewPush(token: string) {
  if (!pushSupported() || Notification.permission !== 'granted') return
  const subscription = await currentSubscription()
  if (subscription) await handIn(token, subscription).catch(() => {})
}
