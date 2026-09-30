import Badge from './Badge'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
}

const SectionHeader = ({ eyebrow, title, subtitle, align = 'center', className = '' }: SectionHeaderProps) => {
  const alignClasses = align === 'center' ? 'text-center items-center mx-auto' : 'text-left items-start'

  return (
    <div className={`flex flex-col gap-4 max-w-2xl mb-12 ${alignClasses} ${className}`}>
      {eyebrow && <Badge>{eyebrow}</Badge>}
      <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-white/60 text-base md:text-lg">{subtitle}</p>}
    </div>
  )
}

export default SectionHeader
