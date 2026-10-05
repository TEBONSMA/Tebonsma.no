import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { FeedMember } from '../lib/feed'
import { memberPath } from '../lib/memberProfile'

interface MemberLinkProps {
  member: FeedMember
  className?: string
  // A picture next to the name: still clickable, but keyboards and screen readers skip it
  // and use the name's link, so they don't meet an empty link first
  duplicate?: boolean
  children: ReactNode
}

// Profiles are for members, so visitors see the name without a link
const MemberLink = ({ member, className = '', duplicate = false, children }: MemberLinkProps) => {
  const { user } = useAuth()
  if (!user) return <span className={className}>{children}</span>
  return (
    <Link
      to={memberPath(member.id)}
      className={`${className} hover:underline`}
      {...(duplicate && { tabIndex: -1, 'aria-hidden': true })}
    >
      {children}
    </Link>
  )
}

export default MemberLink
