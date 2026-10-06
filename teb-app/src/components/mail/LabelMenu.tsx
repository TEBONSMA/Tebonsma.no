import { useState, type FormEvent } from 'react'
import { Check, Tag } from 'lucide-react'
import { errorMessage } from '../../lib/feed'
import { createLabel, type Label, type MailSummary } from '../../lib/mail'
import { ACTION, ERROR_TEXT, INPUT, MENU_ITEM } from '../feed/styles'
import { LABEL_DOT } from './labelStyles'
import PopoverMenu from './PopoverMenu'

interface LabelMenuProps {
  token: string
  labels: Label[]
  // The mails the labels would go on, as the list shows them now
  mails: MailSummary[]
  onChange: (add: string[], remove: string[]) => void
  // A label was made here, so the list of labels should be fetched again
  onCreated: () => void
}

// Labels can be put on many mails at once: a label that every selected mail has is checked, and
// clicking it takes it off them all; otherwise clicking puts it on them all
const LabelMenu = ({ token, labels, mails, onChange, onCreated }: LabelMenuProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const has = (label: Label) => mails.length > 0 && mails.every(mail => mail.labels.includes(label.id))

  const make = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)
    try {
      const label = await createLabel(token, trimmed, 'orange')
      setName('')
      onCreated()
      onChange([label.id], [])
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <PopoverMenu
      label="Etiketter"
      width={240}
      trigger={({ onClick, open }) => (
        <button type="button" className={ACTION} onClick={onClick} aria-haspopup="menu" aria-expanded={open} aria-label="Etiketter" title="Etiketter">
          <Tag size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Etikett</span>
        </button>
      )}
    >
      {() => (
        <>
          <ul className="max-h-60 overflow-y-auto">
            {labels.length === 0 && <li className="px-3 py-2 text-sm text-white/50">Ingen etiketter ennå</li>}
            {labels.map(label => {
              const checked = has(label)
              return (
                <li key={label.id}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    className={MENU_ITEM}
                    onClick={() => (checked ? onChange([], [label.id]) : onChange([label.id], []))}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LABEL_DOT[label.color]}`} />
                    <span className="min-w-0 flex-1 truncate text-left">{label.name}</span>
                    {checked && <Check size={16} aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <form onSubmit={make} className="border-t border-white/10 p-2">
            <input className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder="Ny etikett" maxLength={30} aria-label="Navn på ny etikett" />
            {error && <p className={`${ERROR_TEXT} mt-1`}>{error}</p>}
          </form>
        </>
      )}
    </PopoverMenu>
  )
}

export default LabelMenu
