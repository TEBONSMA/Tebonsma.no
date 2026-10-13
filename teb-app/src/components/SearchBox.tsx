import { Search, X } from 'lucide-react'
import { INPUT } from './feed/styles'
import { cn } from '../lib/utils'

interface Props {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function SearchBox({ id, label, placeholder, value, onChange, className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        id={id}
        type="search"
        autoComplete="off"
        className={cn(INPUT, 'pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden')}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label="Tøm søket"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white"
          onClick={() => onChange('')}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
