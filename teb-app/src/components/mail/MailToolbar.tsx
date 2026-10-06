import type { FormEvent, ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { INPUT } from '../feed/styles'
import { MAIL_SORTS, type MailFilter, type MailSort } from '../../lib/mail'
import { cn } from '../../lib/utils'

interface MailToolbarProps {
  search: string
  onSearch: (q: string) => void
  // Offered when the search is limited to one folder
  onSearchEverywhere: (() => void) | null
  sort: MailSort
  onSort: (sort: MailSort) => void
  filter: MailFilter
  onFilter: (patch: MailFilter) => void
  allChecked: boolean
  someChecked: boolean
  onToggleAll: () => void
  // What can be done with the chosen mails, shown instead of the filters
  actions: ReactNode
  // Without the tick box for everything and the filters that only apply to a mailbox
  selectable?: boolean
}

const FILTERS = [
  { key: 'unread', label: 'Bare uleste' },
  { key: 'flagged', label: 'Favoritter' },
  { key: 'attachment', label: 'Med vedlegg' },
] as const

const MailToolbar = ({
  search,
  onSearch,
  onSearchEverywhere,
  sort,
  onSort,
  filter,
  onFilter,
  allChecked,
  someChecked,
  onToggleAll,
  actions,
  selectable = true,
}: MailToolbarProps) => {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(String(new FormData(e.currentTarget).get('q') ?? '').trim())
  }

  return (
    <div className="space-y-2 border-b border-white/10 px-3 py-2">
      <div className="flex items-center gap-2">
        {selectable && <input
          type="checkbox"
          checked={allChecked}
          ref={el => {
            if (el) el.indeterminate = someChecked && !allChecked
          }}
          onChange={onToggleAll}
          aria-label="Velg alle"
          className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-teb-orange)]"
        />}
        {someChecked ? (
          <div className="min-w-0 flex-1">{actions}</div>
        ) : (
          <form key={search} onSubmit={submit} role="search" className="relative min-w-0 flex-1">
            <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input name="q" type="search" defaultValue={search} placeholder="Søk i mail" aria-label="Søk i mail" maxLength={200} className={cn(INPUT, 'py-1.5 pl-8')} />
          </form>
        )}
      </div>

      {!someChecked && (
        <>
          {search && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
              <span>Søker etter «{search}»</span>
              {onSearchEverywhere && (
                <button type="button" className="cursor-pointer text-teb-orange hover:underline" onClick={onSearchEverywhere}>
                  Søk i alle mapper
                </button>
              )}
              <button type="button" className="inline-flex cursor-pointer items-center gap-1 hover:text-white" onClick={() => onSearch('')}>
                <X size={14} aria-hidden="true" />
                Fjern søk
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {FILTERS.filter(({ key }) => selectable || key === 'unread').map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilter({ [key]: !filter[key] || undefined })}
                  aria-pressed={!!filter[key]}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs cursor-pointer transition-colors',
                    filter[key] ? 'bg-teb-orange text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-white/60">
              <span className="sr-only">Sorter etter</span>
              <select className={cn(INPUT, 'w-auto cursor-pointer py-1 text-xs')} value={sort} onChange={e => onSort(e.target.value as MailSort)}>
                {MAIL_SORTS.map(option => (
                  <option key={option.value} value={option.value} className="bg-neutral-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  )
}

export default MailToolbar
