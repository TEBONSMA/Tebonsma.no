import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { FeedMember } from '../lib/feed'
import { memberPath } from '../lib/memberProfile'

interface MemberLinkProps {
  member: FeedMember
  className?: string
  children: ReactNode
}

// Profiles are for members, so visitors see the name without a link
const MemberLink = ({ member, className = '', children }: MemberLinkProps) => {
  const { user } = useAuth()
  if (!user) return <span className={className}>{children}</span>
  return (
    <Link to={memberPath(member.id)} className={`${className} hover:underline`}>
      {children}
    </Link>
  )
}

export default MemberLink
