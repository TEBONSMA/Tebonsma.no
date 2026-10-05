import { apiFetch, apiFetchBlob } from './api'
import { json } from './feed'

// What the mail pages need to talk to the API's /mail routes. The shapes match what
// src/mail/mail.ts in tebonsma-api returns.

export interface MailAddress {
  name: string
  address: string
}

// The folders every mailbox has, and the ones members make themselves (role is null)
export type Role = 'inbox' | 'sent' | 'drafts' | 'archive' | 'junk' | 'trash' | 'snoozed' | 'scheduled'

export interface Folder {
  key: string
  name: string
  role: Role | null
  unseen: number
  total: number
}

export interface MailSummary {
  id: string
  folder: string
  from: MailAddress | null
  to: MailAddress[]
  subject: string
  preview: string
  date: string
  seen: boolean
  flagged: boolean
  hasAttachments: boolean
  labels: string[]
  size: number
}

export interface MailAttachment {
  n: number
  name: string
  mime: string
  size: number
}

export interface MailMessage extends MailSummary {
  cc: MailAddress[]
  text: string
  // Already cleaned by the API: formatting only, nothing that runs
  html: string
  // Pictures from other sites that were left out
  blockedImages: number
  attachments: MailAttachment[]
  messageId: string | null
  inReplyTo: string | null
  references: string[]
}

export type MailSort = 'new' | 'old' | 'sender' | 'subject' | 'size'

export const MAIL_SORTS = [
  { value: 'new', label: 'Nyeste' },
  { value: 'old', label: 'Eldste' },
  { value: 'sender', label: 'Avsender' },
  { value: 'subject', label: 'Emne' },
  { value: 'size', label: 'Størrelse' },
] as const

export type LabelColor = 'orange' | 'green' | 'blue' | 'purple' | 'pink' | 'yellow' | 'red' | 'gray'

export const LABEL_COLORS: LabelColor[] = ['orange', 'green', 'blue', 'purple', 'pink', 'yellow', 'red', 'gray']

export interface Label {
  id: string
  name: string
  color: LabelColor
}

// What narrows a list down. The lists that cut across folders use folder keys of their own.
export interface MailFilter {
  q?: string
  unread?: boolean
  flagged?: boolean
  attachment?: boolean
  label?: string
}

export const EMPTY_FILTER: MailFilter = {}

// Lists that gather mails from several folders
export const VIRTUAL_FOLDERS = { all: 'Alle mapper', favorites: 'Favoritter', unread: 'Uleste' } as const
export const isVirtualFolder = (key: string): key is keyof typeof VIRTUAL_FOLDERS => Object.hasOwn(VIRTUAL_FOLDERS, key)

export const MAIL_PAGE_SIZE = 30

export const getFolders = (token: string) => apiFetch<{ folders: Folder[]; labels: Label[] }>('/mail/folders', token)

export const createFolder = (token: string, name: string) =>
  apiFetch<{ folders: Folder[] }>('/mail/folders', token, json('POST', { name }))

export interface ListParams {
  folder: string
  sort: MailSort
  filter: MailFilter
  offset: number
  limit?: number
}

export function listMessages(token: string, { folder, sort, filter, offset, limit = MAIL_PAGE_SIZE }: ListParams) {
  const query = new URLSearchParams({ folder, sort, offset: String(offset), limit: String(limit) })
  if (filter.q) query.set('q', filter.q)
  if (filter.unread) query.set('unread', '1')
  if (filter.flagged) query.set('flagged', '1')
  if (filter.attachment) query.set('attachment', '1')
  if (filter.label) query.set('label', filter.label)
  return apiFetch<{ messages: MailSummary[]; nextOffset: number | null; total: number }>(`/mail/messages?${query}`, token)
}

export const getMessage = (token: string, id: string, images = false) =>
  apiFetch<MailMessage>(`/mail/messages/${encodeURIComponent(id)}${images ? '?images=1' : ''}`, token)

export const fetchMailAttachment = (token: string, id: string, attachment: MailAttachment) =>
  apiFetchBlob(`/mail/messages/${encodeURIComponent(id)}/attachments/${attachment.n}`, token)

export async function downloadMailAttachment(token: string, id: string, attachment: MailAttachment) {
  const link = document.createElement('a')
  link.download = attachment.name
  link.href = URL.createObjectURL(await fetchMailAttachment(token, id, attachment))
  link.click()
  // Give the browser a moment to start the download before the address stops working
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000)
}

// "Pia Hansen", or the address when the sender has no name
export const senderName = (address: MailAddress | null) => address?.name || address?.address || 'Ukjent avsender'

const time = new Intl.DateTimeFormat('nb', { hour: '2-digit', minute: '2-digit' })
const sameYear = new Intl.DateTimeFormat('nb', { day: 'numeric', month: 'short' })
const otherYear = new Intl.DateTimeFormat('nb', { day: 'numeric', month: 'short', year: 'numeric' })

// The time for today's mails, the day for older ones
export function listDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return time.format(date)
  return (date.getFullYear() === now.getFullYear() ? sameYear : otherYear).format(date)
}

// --- Changing mails. Each takes a list of ids, so one mail and a selection are the same call. ---

export const setFlags = (token: string, ids: string[], change: { seen?: boolean; flagged?: boolean }) =>
  apiFetch<unknown>('/mail/messages/flags', token, json('POST', { ids, ...change }))

export const changeLabels = (token: string, ids: string[], add: string[], remove: string[]) =>
  apiFetch<unknown>('/mail/messages/labels', token, json('POST', { ids, add, remove }))

export const moveMessages = (token: string, ids: string[], folder: string) =>
  apiFetch<{ moved: number }>('/mail/messages/move', token, json('POST', { ids, folder }))

// Mails in the bin go back to the folder they came from
export const restoreMessages = (token: string, ids: string[]) =>
  apiFetch<{ moved: number }>('/mail/messages/move', token, json('POST', { ids, restore: true }))

export const deleteForever = (token: string, ids: string[]) =>
  apiFetch<{ deleted: number }>('/mail/messages/delete', token, json('POST', { ids }))

export const emptyTrash = (token: string) => apiFetch<{ deleted: number }>('/mail/trash/empty', token, json('POST'))

export const createLabel = (token: string, name: string, color: LabelColor) =>
  apiFetch<Label>('/mail/labels', token, json('POST', { name, color }))

export const updateLabel = (token: string, id: string, changes: { name?: string; color?: LabelColor }) =>
  apiFetch<Label>(`/mail/labels/${id}`, token, json('PATCH', changes))

export const deleteLabel = (token: string, id: string) => apiFetch<unknown>(`/mail/labels/${id}`, token, json('DELETE'))
