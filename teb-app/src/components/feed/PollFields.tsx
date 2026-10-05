import { Plus, X } from 'lucide-react'
import { MAX_POLL_OPTION_LENGTH, MAX_POLL_OPTIONS, MAX_POLL_QUESTION_LENGTH } from '../../lib/feed'
import { ACTION, INPUT } from './styles'

interface PollFieldsProps {
  // Events ask their question here; a post asks it in its own text
  question?: string
  options: string[]
  onQuestion?: (question: string) => void
  onOptions: (options: string[]) => void
  onRemove: () => void
}

const PollFields = ({ question, options, onQuestion, onOptions, onRemove }: PollFieldsProps) => (
  <fieldset className="space-y-2 rounded-md border border-white/10 p-3">
    <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-white/50">Spørreundersøkelse</legend>
    {onQuestion && (
      <input
        className={INPUT}
        value={question ?? ''}
        onChange={e => onQuestion(e.target.value)}
        maxLength={MAX_POLL_QUESTION_LENGTH}
        placeholder="Hva vil du spørre om?"
        aria-label="Spørsmål"
      />
    )}
    {options.map((option, index) => (
      <div key={index} className="flex items-center gap-2">
        <input
          className={INPUT}
          value={option}
          onChange={e => onOptions(options.map((o, i) => (i === index ? e.target.value : o)))}
          maxLength={MAX_POLL_OPTION_LENGTH}
          placeholder={`Svaralternativ ${index + 1}`}
          aria-label={`Svaralternativ ${index + 1}`}
        />
        {options.length > 2 && (
          <button
            type="button"
            onClick={() => onOptions(options.filter((_, i) => i !== index))}
            aria-label={`Fjern svaralternativ ${index + 1}`}
            className="rounded p-2 text-white/50 cursor-pointer hover:bg-white/10 hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    ))}
    <div className="flex flex-wrap items-center justify-between gap-2">
      {options.length < MAX_POLL_OPTIONS ? (
        <button type="button" className={ACTION} onClick={() => onOptions([...options, ''])}>
          <Plus size={16} aria-hidden="true" />
          Legg til alternativ
        </button>
      ) : (
        <span />
      )}
      <button type="button" className={ACTION} onClick={onRemove}>
        Fjern spørreundersøkelsen
      </button>
    </div>
  </fieldset>
)

export default PollFields
