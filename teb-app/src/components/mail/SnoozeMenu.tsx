import { useRef, useState, type FormEvent } from 'react'
import { Clock } from 'lucide-react'
import { snoozePresets, type SnoozePreset } from '../../lib/mail'
import { ACTION, BUTTON_PRIMARY, INPUT, MENU, MENU_ITEM } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'

interface SnoozeMenuProps {
  // True when the mails are in Snoozed already, where the menu can also take snoozing off
  snoozed: boolean
  onSnooze: (until: string | null) => void
}

const when = new Intl.DateTimeFormat('nb', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Local time for the date field: YYYY-MM-DDTHH:mm
const localValue = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

const SnoozeMenu = ({ snoozed, onSnooze }: SnoozeMenuProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // Worked out when the menu opens, so "tomorrow" means tomorrow from then
  const [presets, setPresets] = useState<SnoozePreset[]>([])
  const [minimum, setMinimum] = useState('')
  useDismiss(rootRef, open, () => setOpen(false))

  const choose = (until: string | null) => {
    setOpen(false)
    onSnooze(until)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = String(new FormData(e.currentTarget).get('until') ?? '')
    const date = new Date(value)
    if (value && !Number.isNaN(date.getTime()) && date.getTime() > Date.now()) choose(date.toISOString())
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={ACTION}
        onClick={() => {
          if (!open) {
            const now = new Date()
            setPresets(snoozePresets(now))
            setMinimum(localValue(new Date(now.getTime() + 60_000)))
          }
          setOpen(o => !o)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Utsett"
        title="Utsett"
      >
        <Clock size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Utsett</span>
      </button>
      {open && (
        <div role="menu" className={`${MENU} left-0 top-[calc(100%+4px)] w-64`}>
          {snoozed && (
            <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => choose(null)}>
              Fjern utsettelsen
            </button>
          )}
          {presets.map(preset => (
            <button key={preset.label} type="button" role="menuitem" className={`${MENU_ITEM} justify-between`} onClick={() => choose(preset.until.toISOString())}>
              <span>{preset.label}</span>
              <span className="text-xs font-normal text-white/40">{when.format(preset.until)}</span>
            </button>
          ))}
          <form onSubmit={submit} className="mt-1 space-y-2 border-t border-white/10 p-2">
            <label className="block text-xs text-white/50" htmlFor="snooze-until">
              Velg dato og tid
            </label>
            <input id="snooze-until" name="until" type="datetime-local" min={minimum} required className={INPUT} />
            <button type="submit" className={`${BUTTON_PRIMARY} w-full`}>
              Utsett
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default SnoozeMenu
