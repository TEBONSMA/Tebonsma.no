import { STATUS_LABEL, type Status } from '../../lib/vedtekter'

const COLORS: Record<Status, string> = {
  utkast: 'border-white/15 text-white/60',
  innsendt: 'border-teb-orange/40 text-teb-orange-light',
  trukket: 'border-white/10 text-white/40',
  vedtatt: 'border-green-400/40 text-green-300',
  forkastet: 'border-red-400/30 text-red-300',
}

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${COLORS[status]}`}>{STATUS_LABEL[status]}</span>
}
