import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { errorMessage, listMembers, type FeedMember } from '../../lib/feed'
import { getMemberProfile, OWN_PROFILE } from '../../lib/memberProfile'
import Avatar from '../Avatar'
import { ERROR_TEXT, INPUT, MENU, MENU_ITEM } from './styles'

const MAX_SUGGESTIONS = 6

interface OrganizerPickerProps {
  token: string
  // The organizers chosen so far, besides the one who made the event
  selected: FeedMember[]
  onChange: (organizers: FeedMember[]) => void
}

// Choose the members who may edit the event along with its author
const OrganizerPicker = ({ token, selected, onChange }: OrganizerPickerProps) => {
  const [members, setMembers] = useState<FeedMember[]>([])
  const [ownId, setOwnId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listMembers(token), getMemberProfile(token, OWN_PROFILE)])
      .then(([all, own]) => {
        if (cancelled) return
        setMembers(all)
        setOwnId(own.member.id)
      })
      .catch(err => !cancelled && setError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [token])

  const suggestions = useMemo(() => {
    const wanted = query.trim().toLocaleLowerCase('nb')
    if (!wanted) return []
    return members
      .filter(m => m.id !== ownId && !selected.some(s => s.id === m.id) && m.name.toLocaleLowerCase('nb').includes(wanted))
      .slice(0, MAX_SUGGESTIONS)
  }, [members, ownId, query, selected])

  const add = (member: FeedMember) => {
    onChange([...selected, member])
    setQuery('')
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs text-white/50">Arrangører (kan redigere arrangementet)</span>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map(member => (
            <li key={member.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 py-0.5 pl-1 pr-1.5 text-sm text-white/90">
              <Avatar name={member.name} path={member.avatar} className="h-5 w-5 text-[9px]" />
              {member.name}
              <button
                type="button"
                className="cursor-pointer text-white/50 hover:text-white"
                aria-label={`Fjern ${member.name}`}
                onClick={() => onChange(selected.filter(s => s.id !== member.id))}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <input
          className={INPUT}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Legg til arrangør – søk etter navn"
          aria-label="Legg til arrangør"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div role="listbox" className={`${MENU} left-0 right-0 top-[calc(100%+4px)]`}>
            {suggestions.map(member => (
              <button key={member.id} type="button" role="option" aria-selected={false} className={MENU_ITEM} onClick={() => add(member)}>
                <Avatar name={member.name} path={member.avatar} className="h-6 w-6 text-[10px]" />
                {member.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </div>
  )
}

export default OrganizerPicker
