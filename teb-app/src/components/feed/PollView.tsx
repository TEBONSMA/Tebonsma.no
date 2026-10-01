import { useState } from 'react'
import { Check } from 'lucide-react'
import { errorMessage, votePoll, type Poll } from '../../lib/feed'
import { ERROR_TEXT } from './styles'

interface PollViewProps {
  postId: string
  poll: Poll
  token: string | null
  onChange: (poll: Poll) => void
}

// Results are always shown. Members vote by picking an option, and take the vote back by
// picking it again.
const PollView = ({ postId, poll, token, onChange }: PollViewProps) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vote = async (optionId: string) => {
    if (!token) return
    setBusy(true)
    setError(null)
    try {
      onChange(await votePoll(token, postId, poll.myVote === optionId ? null : optionId))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      {poll.options.map(option => {
        const mine = poll.myVote === option.id
        const percent = poll.totalVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0
        return (
          <button
            key={option.id}
            type="button"
            disabled={!token || busy}
            aria-pressed={mine}
            onClick={() => vote(option.id)}
            className={`relative block w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition-colors enabled:cursor-pointer ${
              mine ? 'border-teb-orange/70' : 'border-white/10 enabled:hover:border-white/30'
            }`}
          >
            <span
              className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${mine ? 'bg-teb-orange/25' : 'bg-white/10'}`}
              style={{ width: `${percent}%` }}
              aria-hidden="true"
            />
            <span className="relative flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-white">
                {mine && <Check size={16} aria-hidden="true" className="shrink-0 text-teb-orange" />}
                <span className="break-words">{option.text}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-white/60">
                {percent}% · {option.votes}
              </span>
            </span>
          </button>
        )
      })}
      <p className="text-xs text-white/50">
        {poll.totalVotes} {poll.totalVotes === 1 ? 'stemme' : 'stemmer'}
        {!token && ' · Logg inn for å stemme'}
        {token && poll.myVote && ' · Trykk på valget ditt igjen for å angre'}
      </p>
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </div>
  )
}

export default PollView
