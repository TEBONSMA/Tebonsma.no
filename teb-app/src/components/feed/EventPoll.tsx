import { useState, type FormEvent } from 'react'
import { ChartBar } from 'lucide-react'
import { addEventPoll, errorMessage, type Poll } from '../../lib/feed'
import PollFields from './PollFields'
import PollView from './PollView'
import { ACTION, BUTTON_GHOST, BUTTON_PRIMARY, ERROR_TEXT } from './styles'

interface EventPollProps {
  postId: string
  poll: Poll | null
  token: string | null
  // Whoever arranges the event can add the poll
  canAdd: boolean
  onChange: (poll: Poll) => void
}

// The poll of an event sits under its description, and asks a question of its own
const EventPoll = ({ postId, poll, token, canAdd, onChange }: EventPollProps) => {
  const [adding, setAdding] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (poll) {
    return (
      <div className="space-y-2 rounded-md border border-white/10 p-3">
        {poll.question && <p className="text-sm font-semibold text-white">{poll.question}</p>}
        <PollView postId={postId} poll={poll} token={token} onChange={onChange} />
      </div>
    )
  }
  if (!canAdd || !token) return null

  if (!adding) {
    return (
      <button type="button" className={ACTION} onClick={() => setAdding(true)}>
        <ChartBar size={18} aria-hidden="true" />
        Legg til spørreundersøkelse
      </button>
    )
  }

  const filled = options.map(option => option.trim()).filter(Boolean)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onChange(await addEventPoll(token, postId, question, filled))
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <PollFields question={question} options={options} onQuestion={setQuestion} onOptions={setOptions} onRemove={() => setAdding(false)} />
      <div className="flex justify-end gap-2">
        <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => setAdding(false)}>
          Avbryt
        </button>
        <button type="submit" className={BUTTON_PRIMARY} disabled={busy || !question.trim() || filled.length < 2}>
          Legg til
        </button>
      </div>
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </form>
  )
}

export default EventPoll
