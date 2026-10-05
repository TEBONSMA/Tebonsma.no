import type { LabelColor } from '../../lib/mail'

// Written out in full so Tailwind finds the classes
export const LABEL_CHIP: Record<LabelColor, string> = {
  orange: 'bg-orange-500/20 text-orange-200',
  green: 'bg-emerald-500/20 text-emerald-200',
  blue: 'bg-sky-500/20 text-sky-200',
  purple: 'bg-violet-500/20 text-violet-200',
  pink: 'bg-pink-500/20 text-pink-200',
  yellow: 'bg-amber-400/20 text-amber-200',
  red: 'bg-red-500/20 text-red-200',
  gray: 'bg-white/10 text-white/70',
}

export const LABEL_DOT: Record<LabelColor, string> = {
  orange: 'bg-orange-400',
  green: 'bg-emerald-400',
  blue: 'bg-sky-400',
  purple: 'bg-violet-400',
  pink: 'bg-pink-400',
  yellow: 'bg-amber-300',
  red: 'bg-red-400',
  gray: 'bg-white/50',
}
