import type { Label } from '../../lib/mail'
import { cn } from '../../lib/utils'
import { LABEL_CHIP } from './labelStyles'

interface LabelChipsProps {
  // The ids on the mail, shown with the names and colours the member has chosen
  ids: string[]
  labels: Label[]
  className?: string
}

const LabelChips = ({ ids, labels, className }: LabelChipsProps) => {
  const shown = ids.flatMap(id => labels.find(label => label.id === id) ?? [])
  if (shown.length === 0) return null
  return (
    <span className={cn('flex flex-wrap gap-1', className)}>
      {shown.map(label => (
        <span key={label.id} className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', LABEL_CHIP[label.color])}>
          {label.name}
        </span>
      ))}
    </span>
  )
}

export default LabelChips
