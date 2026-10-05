import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { errorMessage } from '../../lib/feed'
import { shareToFeed, shareWithMember, type MailSummary, type Member } from '../../lib/mail'
import { cn } from '../../lib/utils'
import Avatar from '../Avatar'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT } from '../feed/styles'

type Target = 'member' | 'feed'

interface ShareDialogProps {
  token: string
  mail: MailSummary
  members: Member[]
  onClose: () => void
  // The mail was shared; what to tell the member
  onShared: (message: string) => void
}

// Shares one mail: with a member, who finds a copy under "Delt med meg", or to the feed, where it is quoted in a post
const ShareDialog = ({ token, mail, members, onClose, onShared }: ShareDialogProps) => {
  const [target, setTarget] = useState<Target>('member')
  const [memberId, setMemberId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [comment, setComment] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'members'>('members')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = search.trim().toLowerCase()
  const shown = members.filter(m => !query || m.name.toLowerCase().includes(query))
  const chosen = members.find(m => m.id === memberId)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (target === 'member') {
        if (!chosen) throw new Error('Velg et medlem')
        await shareWithMember(token, mail.id, chosen.id, note)
        onShared(`Mailen er delt med ${chosen.name}`)
      } else {
        const { skipped } = await shareToFeed(token, mail.id, comment, visibility)
        onShared(skipped.length > 0 ? `Delt i feeden. Disse filene ble ikke med: ${skipped.join(', ')}` : 'Mailen er delt i feeden')
      }
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Del mail">
      <form onSubmit={submit} className={`${CARD} flex max-h-full w-full max-w-md flex-col overflow-hidden bg-neutral-950`}>
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Del mail</h2>
            <p className="truncate text-xs text-white/50">{mail.subject || '(uten emne)'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Lukk" className="cursor-pointer rounded p-1 text-white/60 hover:bg-white/10 hover:text-white">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" className="grid grid-cols-2 gap-1 border-b border-white/10 p-2">
          {(['member', 'feed'] as const).map(value => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={target === value}
              onClick={() => setTarget(value)}
              className={cn('cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors', target === value ? 'bg-white/10 font-semibold text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}
            >
              {value === 'member' ? 'Med et medlem' : 'Til feeden'}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {target === 'member' ? (
            <>
              <input className={INPUT} placeholder="Søk etter medlem" value={search} onChange={e => setSearch(e.target.value)} aria-label="Søk etter medlem" />
              <ul className="max-h-48 overflow-y-auto rounded-md border border-white/10">
                {shown.length === 0 && <li className="px-3 py-2 text-sm text-white/50">Ingen medlemmer funnet</li>}
                {shown.map(member => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => setMemberId(member.id)}
                      aria-pressed={member.id === memberId}
                      className={cn('flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/10', member.id === memberId && 'bg-white/10')}
                    >
                      <Avatar name={member.name} path={member.avatar} className="h-7 w-7 text-[11px]" />
                      <span className="min-w-0 flex-1 truncate text-white">{member.name}</span>
                      {member.id === memberId && <Check size={16} aria-hidden="true" className="text-teb-orange" />}
                    </button>
                  </li>
                ))}
              </ul>
              <textarea className={`${INPUT} min-h-20`} placeholder="Legg til et notat (valgfritt)" value={note} maxLength={500} onChange={e => setNote(e.target.value)} aria-label="Notat" />
              <p className="text-xs text-white/40">Medlemmet får en kopi av mailen med vedlegg under «Delt med meg». Mailen din blir liggende der den er.</p>
            </>
          ) : (
            <>
              <textarea className={`${INPUT} min-h-20`} placeholder="Skriv noe til innlegget (valgfritt)" value={comment} maxLength={1000} onChange={e => setComment(e.target.value)} aria-label="Kommentar" />
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-white/80">Hvem kan se innlegget?</legend>
                {([
                  ['members', 'Bare medlemmer'],
                  ['public', 'Alle, også de som ikke er logget inn'],
                ] as const).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                    <input type="radio" name="visibility" className="accent-[var(--color-teb-orange)]" checked={visibility === value} onChange={() => setVisibility(value)} />
                    {label}
                  </label>
                ))}
              </fieldset>
              <p className="text-xs text-white/40">Avsender, emne og tekst siteres i innlegget, og filene følger med. Tenk over hva mailen inneholder før du deler den.</p>
            </>
          )}
          {error && <p className={ERROR_TEXT}>{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button type="button" className={BUTTON_GHOST} onClick={onClose}>
            Avbryt
          </button>
          <button type="submit" className={BUTTON_PRIMARY} disabled={busy || (target === 'member' && !chosen)}>
            {busy ? 'Deler…' : 'Del'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default ShareDialog
