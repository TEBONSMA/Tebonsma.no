import { useState, type FormEvent } from 'react'
import { snoozePresets, type SnoozePreset } from '../../lib/mail'
import { BUTTON_PRIMARY, INPUT, MENU_ITEM } from '../feed/styles'

const when = new Intl.DateTimeFormat('nb', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Local time for the date field: YYYY-MM-DDTHH:mm
const localValue = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

interface TimeChoicesProps {
  onChoose: (until: Date) => void
  submitLabel: string
  // What the buttons mean, before they are pressed: snoozing and sending later both pick a time
  inputId: string
}

// A few times to pick from, counted from when this was opened, and a date and time of one's own.
// Used by the menus that bring a mail back later or send it later.
const TimeChoices = ({ onChoose, submitLabel, inputId }: TimeChoicesProps) => {
  // Worked out once, when the menu opens, so "tomorrow" means tomorrow from then
  const [opened] = useState(() => new Date())
  const presets: SnoozePreset[] = snoozePresets(opened)
  const minimum = localValue(new Date(opened.getTime() + 2 * 60_000))

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = String(new FormData(e.currentTarget).get('until') ?? '')
    const date = new Date(value)
    if (value && !Number.isNaN(date.getTime()) && date.getTime() > Date.now()) onChoose(date)
  }

  return (
    <>
      {presets.map(preset => (
        <button key={preset.label} type="button" role="menuitem" className={`${MENU_ITEM} justify-between`} onClick={() => onChoose(preset.until)}>
          <span>{preset.label}</span>
          <span className="text-xs font-normal text-white/40">{when.format(preset.until)}</span>
        </button>
      ))}
      <form onSubmit={submit} className="mt-1 space-y-2 border-t border-white/10 p-2">
        <label className="block text-xs text-white/50" htmlFor={inputId}>
          Velg dato og tid
        </label>
        <input id={inputId} name="until" type="datetime-local" min={minimum} required className={INPUT} />
        <button type="submit" className={`${BUTTON_PRIMARY} w-full`}>
          {submitLabel}
        </button>
      </form>
    </>
  )
}

export default TimeChoices
