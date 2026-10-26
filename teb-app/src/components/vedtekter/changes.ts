import { flatten, type Change, type ChangeInput, type ChangeSummary, type Vedtekter } from '../../lib/vedtekter'

// "Endrer § 4.2.3 Buran Baddie", for the lists
export function summaryText(change: ChangeSummary) {
  if (change.type === 'legge-til') {
    const where = change.after ? ` etter ${change.after}` : change.parent ? ` først i ${change.parent}` : ' først i vedtektene'
    return `Ny paragraf «${change.title}»${where}`
  }
  return `${change.type === 'endre' ? 'Endrer' : 'Sletter'} ${change.paragraph ?? ''} ${change.title}`.trim()
}

interface Version {
  title: string
  text: string
}

// A change as ChangeView shows it
export interface ChangeShown {
  // "Endrer § 4.2.3 Buran Baddie / Styremedlem"
  heading: string
  before: Version | null
  after: Version | null
  note?: string
  warning?: string
}

const find = (document: Vedtekter, id: string) => flatten(document.paragrafer).find(place => place.paragraph.id === id)?.paragraph

// Where a new paragraph goes and the number it gets, in the vedtekter as they are now
export function placement(document: Vedtekter, parentId: string | null, afterId: string | null) {
  const parent = parentId ? (find(document, parentId) ?? null) : null
  const siblings = parent ? parent.barn : document.paragrafer
  const index = afterId ? siblings.findIndex(sibling => sibling.id === afterId) + 1 : 0
  const after = afterId ? find(document, afterId) : null
  const number = `${parent ? `${parent.nummer}.` : ''}${index + 1}`
  const where = after ? `etter § ${after.nummer} ${after.tittel}` : parent ? `først i § ${parent.nummer} ${parent.tittel}` : 'først i vedtektene'
  return { number, where }
}

// "Med 3 paragrafer under": what goes with a paragraph that is deleted
function underneath(document: Vedtekter, id: string) {
  const paragraph = find(document, id)
  const count = paragraph ? flatten(paragraph.barn).length : 0
  return count ? `Med ${count} ${count === 1 ? 'paragraf' : 'paragrafer'} under` : undefined
}

// A change as proposed, against the vedtekter as they are now
export function showChange(document: Vedtekter, change: Change): ChangeShown {
  if (change.type === 'legge-til') {
    const { number, where } = placement(document, change.parent, change.after)
    return { heading: `Ny paragraf, § ${number}`, note: `Plassert ${where}`, before: null, after: { title: change.title, text: change.text } }
  }
  const shown = change.current ?? change.original
  const changed = !!change.current && !!change.original && (change.current.kilde !== change.original.kilde || change.current.tittel !== change.original.tittel)
  const warning = !change.current
    ? 'Paragrafen finnes ikke lenger i vedtektene.'
    : changed
      ? 'Paragrafen er endret etter at forslaget ble skrevet. Endringen vises fra slik den var da.'
      : undefined
  const before = change.original ? { title: change.original.tittel, text: change.original.kilde } : null
  const name = `§ ${shown?.nummer ?? '?'} ${shown?.tittel ?? ''}`
  if (change.type === 'slette') return { heading: `Sletter ${name}`, note: underneath(document, change.target), warning, before, after: null }
  return { heading: `Endrer ${name}`, warning, before, after: { title: change.title, text: change.text } }
}

// --- The form

// A change as the form holds it. A new paragraph is placed at a paragraph: after it, or first
// under it; no paragraph means first in the vedtekter.
export interface Draft {
  key: number
  type: ChangeInput['type']
  target: string
  anchor: string
  position: 'etter' | 'under'
  title: string
  text: string
}

let nextKey = 1
const blank = () => ({ key: nextKey++, target: '', anchor: '', position: 'etter' as const, title: '', text: '' })

// A stored change back in the form, for editing or an amendment
export function draftOf(change: ChangeInput): Draft {
  if (change.type === 'legge-til') {
    const text = { title: change.title, text: change.text }
    if (change.after) return { ...blank(), type: 'legge-til', anchor: change.after, ...text }
    if (change.parent) return { ...blank(), type: 'legge-til', anchor: change.parent, position: 'under', ...text }
    return { ...blank(), type: 'legge-til', ...text }
  }
  if (change.type === 'slette') return { ...blank(), type: 'slette', target: change.target }
  return { ...blank(), type: 'endre', target: change.target, title: change.title, text: change.text }
}

// A change at a paragraph; one that changes it starts with the text it has now
export function draftAt(document: Vedtekter, type: ChangeInput['type'], id: string): Draft {
  const paragraph = id ? find(document, id) : undefined
  if (!paragraph) return { ...blank(), type }
  if (type === 'legge-til') return { ...blank(), type, anchor: id }
  return { ...blank(), type, target: id, title: paragraph.tittel, text: paragraph.kilde }
}

export function inputOf(document: Vedtekter, draft: Draft): ChangeInput {
  if (draft.type === 'endre') return { type: 'endre', target: draft.target, title: draft.title, text: draft.text }
  if (draft.type === 'slette') return { type: 'slette', target: draft.target }
  if (!draft.anchor) return { type: 'legge-til', parent: null, after: null, title: draft.title, text: draft.text }
  if (draft.position === 'under') return { type: 'legge-til', parent: draft.anchor, after: null, title: draft.title, text: draft.text }
  const parent = flatten(document.paragrafer).find(item => item.paragraph.id === draft.anchor)?.parent ?? null
  return { type: 'legge-til', parent: parent?.id ?? null, after: draft.anchor, title: draft.title, text: draft.text }
}

// A change being written in the form, against the vedtekter as they are now
export function showDraft(document: Vedtekter, change: ChangeInput): ChangeShown | null {
  if (change.type === 'legge-til') return showChange(document, change)
  const paragraph = find(document, change.target)
  if (!paragraph) return null
  const snapshot = { nummer: paragraph.nummer, tittel: paragraph.tittel, kilde: paragraph.kilde }
  return showChange(document, { ...change, original: snapshot, current: snapshot } as Change)
}
