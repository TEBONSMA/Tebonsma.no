// Word by word, what was taken out of a text and what was put in, for showing a proposed change
export interface Piece {
  kind: 'same' | 'added' | 'removed'
  text: string
}

// Longer than this and the whole text is shown as replaced, to keep the comparison quick
const MAX_TOKENS = 4000

const tokens = (text: string) => text.split(/(\s+)/).filter(Boolean)

export function wordDiff(before: string, after: string): Piece[] {
  const a = tokens(before)
  const b = tokens(after)
  if (a.length * b.length > MAX_TOKENS * MAX_TOKENS) {
    return [
      ...(before ? [{ kind: 'removed' as const, text: before }] : []),
      ...(after ? [{ kind: 'added' as const, text: after }] : []),
    ]
  }
  // The longest common sequence of words, from the end
  const lengths = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }
  const pieces: Piece[] = []
  const push = (kind: Piece['kind'], text: string) => {
    const last = pieces[pieces.length - 1]
    if (last?.kind === kind) last.text += text
    else pieces.push({ kind, text })
  }
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i])
      i++
      j++
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      push('removed', a[i++])
    } else {
      push('added', b[j++])
    }
  }
  while (i < a.length) push('removed', a[i++])
  while (j < b.length) push('added', b[j++])
  return joinChanges(pieces)
}

// A space between two changes goes with them, so "7 (sju)" to "9 (ni)" reads as one change
function joinChanges(pieces: Piece[]): Piece[] {
  const out: Piece[] = []
  let removed = ''
  let added = ''
  const flush = () => {
    if (removed) out.push({ kind: 'removed', text: removed })
    if (added) out.push({ kind: 'added', text: added })
    removed = ''
    added = ''
  }
  pieces.forEach((piece, k) => {
    if (piece.kind === 'removed') removed += piece.text
    else if (piece.kind === 'added') added += piece.text
    else if ((removed || added) && /^\s+$/.test(piece.text) && pieces[k + 1] && pieces[k + 1].kind !== 'same') {
      removed += piece.text
      added += piece.text
    } else {
      flush()
      out.push(piece)
    }
  })
  flush()
  return out
}
