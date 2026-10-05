import { useId, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { Member, Person } from '../../lib/mail'
import { cn } from '../../lib/utils'
import Avatar from '../Avatar'
import { MENU, MENU_ITEM } from '../feed/styles'

interface RecipientInputProps {
  label: string
  people: Person[]
  onChange: (people: Person[]) => void
  members: Member[]
}

const LOOKS_LIKE_ADDRESS = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/
const SEPARATORS = /[\s,;]+/
const MAX_SUGGESTIONS = 6

const personLabel = (person: Person) => person.name || person.address || ''

// Who a mail goes to, as chips: members are found by name, and other addresses are typed in
const RecipientInput = ({ label, people, onChange, members }: RecipientInputProps) => {
  const id = useId()
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  const query = text.trim().toLowerCase()
  const suggestions = query
    ? members.filter(m => m.name.toLowerCase().includes(query) && !people.some(p => p.memberId === m.id)).slice(0, MAX_SUGGESTIONS)
    : []

  const addAddress = (raw: string) => {
    const address = raw.trim()
    if (!LOOKS_LIKE_ADDRESS.test(address)) return false
    if (!people.some(p => p.address?.toLowerCase() === address.toLowerCase())) onChange([...people, { name: '', address }])
    return true
  }

  // Whatever is typed becomes a chip when it is an address; a name stays until one is picked
  const commit = () => {
    if (text.trim() && addAddress(text)) setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === ' ') && text.trim()) {
      if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault()
        pick(suggestions[0])
      } else if (addAddress(text)) {
        e.preventDefault()
        setText('')
      } else if (e.key === 'Enter') {
        e.preventDefault()
      }
    } else if (e.key === 'Backspace' && !text && people.length > 0) {
      onChange(people.slice(0, -1))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!SEPARATORS.test(pasted.trim())) return
    e.preventDefault()
    const added = pasted.split(SEPARATORS).filter(part => LOOKS_LIKE_ADDRESS.test(part))
    onChange([...people, ...added.filter(a => !people.some(p => p.address?.toLowerCase() === a.toLowerCase())).map(address => ({ name: '', address }))])
  }

  const pick = (member: Member) => {
    onChange([...people, { name: member.name, memberId: member.id }])
    setText('')
  }

  return (
    <div className="relative flex items-start gap-2">
      <label htmlFor={id} className="w-20 shrink-0 pt-2 text-sm text-white/50">
        {label}
      </label>
      <div className="relative min-w-0 flex-1">
        <div className={cn('flex flex-wrap items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5', focused && 'border-teb-orange')}>
          {people.map((person, index) => (
            <span key={`${person.memberId ?? person.address}:${index}`} className="inline-flex items-center gap-1 rounded-full bg-white/10 py-0.5 pl-2.5 pr-1 text-sm text-white">
              <span className="max-w-48 truncate" title={person.address}>{personLabel(person)}</span>
              <button
                type="button"
                onClick={() => onChange(people.filter((_, i) => i !== index))}
                aria-label={`Fjern ${personLabel(person)}`}
                className="cursor-pointer rounded-full p-0.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            id={id}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              commit()
            }}
            autoComplete="off"
            className="min-w-32 flex-1 bg-transparent py-0.5 text-sm text-white placeholder-white/30 outline-none"
            placeholder={people.length === 0 ? 'Navn eller e-postadresse' : ''}
          />
        </div>
        {focused && suggestions.length > 0 && (
          <ul role="listbox" className={`${MENU} left-0 top-[calc(100%+4px)] w-72 max-w-full`}>
            {suggestions.map(member => (
              <li key={member.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className={MENU_ITEM}
                  // Picked before the field loses focus, which would close the list
                  onMouseDown={e => {
                    e.preventDefault()
                    pick(member)
                  }}
                >
                  <Avatar name={member.name} path={member.avatar} className="h-6 w-6 text-[10px]" />
                  <span className="min-w-0 flex-1 truncate text-left">{member.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default RecipientInput
