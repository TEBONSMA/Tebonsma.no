import { wordDiff } from '../../lib/diff'
import type { ChangeShown } from './changes'

// Taken out struck through in red, put in in green, the rest as it is
function Diff({ before, after, className }: { before: string; after: string; className: string }) {
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {wordDiff(before, after).map((piece, i) =>
        piece.kind === 'same' ? (
          <span key={i}>{piece.text}</span>
        ) : piece.kind === 'added' ? (
          <ins key={i} className="rounded-sm bg-green-500/15 text-green-200 no-underline">
            {piece.text}
          </ins>
        ) : (
          <del key={i} className="rounded-sm bg-red-500/15 text-red-200/80 decoration-red-300/70">
            {piece.text}
          </del>
        ),
      )}
    </p>
  )
}

// One change in a proposal: what it touches, and the text before and after, as written in the repo
export default function ChangeView({ change }: { change: ChangeShown }) {
  const before = change.before ?? { title: '', text: '' }
  const after = change.after ?? { title: '', text: '' }
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{change.heading}</p>
      {change.note && <p className="mt-1 text-xs text-white/50">{change.note}</p>}
      {change.warning && <p className="mt-2 rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-200">{change.warning}</p>}
      <Diff before={before.title} after={after.title} className="mt-3 font-semibold text-white" />
      {(before.text || after.text) && <Diff before={before.text} after={after.text} className="mt-2 text-sm leading-relaxed text-white/80" />}
    </div>
  )
}
