import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
}

const Badge = ({ children, className = '' }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-white/70 border border-white/15 rounded-full px-3 py-1 bg-white/5 ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
