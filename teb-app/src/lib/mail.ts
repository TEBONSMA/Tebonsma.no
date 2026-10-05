import { apiFetch, apiFetchBlob } from './api'
import { json, type Attachment } from './feed'

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
  // For a conversation, the id of its newest mail
  id: string
  // The mails the row stands for: just this one, or the whole conversation. Changes apply to all of them.
  ids: string[]
  count: number
  unreadCount: number
  participants: MailAddress[]
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

// The mails of a conversation, oldest first. Those that were unread have been marked as read.
export const getConversation = (token: string, id: string) =>
  apiFetch<{ messages: MailSummary[] }>(`/mail/threads/${encodeURIComponent(id)}`, token)

// What a whole conversation looks like to the buttons that act on it
export function conversationSummary(messages: MailSummary[]): MailSummary {
  const newest = messages[messages.length - 1]
  return {
    ...newest,
    ids: messages.map(mail => mail.id).reverse(),
    count: messages.length,
    unreadCount: messages.filter(mail => !mail.seen).length,
    seen: messages.every(mail => mail.seen),
    flagged: messages.some(mail => mail.flagged),
    labels: [...new Set(messages.flatMap(mail => mail.labels))],
  }
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

// --- Writing ---

// Somebody a mail goes to: an address, or a member of the site, whose address only the API knows
export interface Person {
  name: string
  address?: string
  memberId?: string
}

// A member as the site lists them: no username, no address
export interface Member {
  id: string
  name: string
  avatar: string | null
}

export const getMembers = (token: string) => apiFetch<Member[]>('/members', token)

export interface Threading {
  inReplyTo: string | null
  references: string[]
}

export interface ComposeFields {
  to: Person[]
  cc: Person[]
  bcc: Person[]
  subject: string
  html: string
  // The mail is kept as a draft under this id until it has been sent
  draftId: string | null
  replyTo: string | null
  forwardOf: string | null
  threading: Threading | null
}

export interface ComposeSeed {
  fields: ComposeFields
  attachments: Attachment[]
}

export const EMPTY_FIELDS: ComposeFields = {
  to: [],
  cc: [],
  bcc: [],
  subject: '',
  html: '',
  draftId: null,
  replyTo: null,
  forwardOf: null,
  threading: null,
}

export type ComposeMode = 'reply' | 'replyAll' | 'forward' | 'draft'

interface ComposeStart extends Omit<ComposeFields, 'to' | 'cc' | 'bcc'> {
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  attachments: Attachment[]
}

const fromAddress = (a: MailAddress): Person => ({ name: a.name, address: a.address })

// What a new mail starts with when it answers, forwards or continues another
export async function getComposeSeed(token: string, id: string, mode: ComposeMode): Promise<ComposeSeed> {
  const start = await apiFetch<ComposeStart>(`/mail/messages/${encodeURIComponent(id)}/compose?mode=${mode}`, token)
  const { attachments, ...fields } = start
  return {
    fields: { ...fields, to: start.to.map(fromAddress), cc: start.cc.map(fromAddress), bcc: start.bcc.map(fromAddress) },
    attachments,
  }
}

export interface MailSettings {
  // HTML, put at the end of new mails
  signature: string
  undoSeconds: number
  conversations: boolean
}

export const getMailSettings = (token: string) => apiFetch<MailSettings>('/mail/settings', token)

export const saveMailSettings = (token: string, settings: MailSettings) =>
  apiFetch<MailSettings>('/mail/settings', token, json('PUT', settings))

export const MAX_MAIL_ATTACHMENT_BYTES = 25 * 1024 * 1024
export const MAX_MAIL_ATTACHMENTS = 30
export const MAX_RECIPIENTS = 50

export function uploadMailFile(token: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<Attachment>('/mail/uploads', token, { method: 'POST', body: form })
}

const recipient = (person: Person) => (person.memberId ? { memberId: person.memberId } : person.address)

function payloadOf(fields: ComposeFields, attachments: Attachment[]) {
  return {
    to: fields.to.map(recipient),
    cc: fields.cc.map(recipient),
    bcc: fields.bcc.map(recipient),
    subject: fields.subject,
    html: fields.html,
    uploadIds: attachments.map(a => a.id),
    replyTo: fields.replyTo,
    forwardOf: fields.forwardOf,
    threading: fields.threading,
  }
}

export const saveDraft = (token: string, draftId: string, fields: ComposeFields, attachments: Attachment[]) =>
  apiFetch<{ draftId: string }>(`/mail/drafts/${draftId}`, token, json('PUT', payloadOf(fields, attachments)))

export const deleteDraft = (token: string, draftId: string) => apiFetch<unknown>(`/mail/drafts/${draftId}`, token, json('DELETE'))

export interface Sent {
  // Until sendAt the sending can be taken back. Null when there is no waiting time and the mail has gone.
  outboxId: string | null
  sendAt: string
  draftId: string
}

export const sendMail = (token: string, fields: ComposeFields, attachments: Attachment[]) =>
  apiFetch<Sent>('/mail/send', token, json('POST', { ...payloadOf(fields, attachments), draftId: fields.draftId }))

export const cancelSend = (token: string, outboxId: string) => apiFetch<{ draftId: string }>(`/mail/outbox/${outboxId}`, token, json('DELETE'))

// --- Snoozing ---

// With a time the mails leave the inbox until then. With null, snoozing is taken off.
export const snoozeMessages = (token: string, ids: string[], until: string | null) =>
  apiFetch<{ moved: number }>('/mail/messages/snooze', token, json('POST', { ids, until }))

export interface SnoozePreset {
  label: string
  until: Date
}

const at = (base: Date, daysAhead: number, hour: number) => {
  const day = new Date(base)
  day.setDate(day.getDate() + daysAhead)
  day.setHours(hour, 0, 0, 0)
  return day
}

// The times the snooze menu offers, counted from now: later today, tomorrow, the weekend and next week
export function snoozePresets(now: Date): SnoozePreset[] {
  const presets: SnoozePreset[] = []
  if (now.getHours() < 15) presets.push({ label: 'Senere i dag', until: at(now, 0, 18) })
  presets.push({ label: 'I morgen', until: at(now, 1, 8) })
  const weekday = now.getDay() // 0 is Sunday
  if (weekday >= 1 && weekday <= 5) presets.push({ label: 'I helgen', until: at(now, 6 - weekday, 9) })
  presets.push({ label: 'Neste uke', until: at(now, weekday === 0 ? 1 : 8 - weekday, 8) })
  return presets
}

// --- Auto-reply ---

export interface AutoReply {
  enabled: boolean
  subject: string
  body: string
  // The first and last day it answers, as YYYY-MM-DD
  from: string | null
  to: string | null
}

export const getAutoReply = (token: string) => apiFetch<AutoReply>('/mail/auto-reply', token)

export const saveAutoReply = (token: string, settings: AutoReply) =>
  apiFetch<AutoReply>('/mail/auto-reply', token, json('PUT', settings))
