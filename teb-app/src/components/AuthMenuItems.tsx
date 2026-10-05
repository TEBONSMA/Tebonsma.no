import { Link } from 'react-router-dom'
import { LogIn, LogOut, User, UserCog } from 'lucide-react'
import { useProfile } from '../account/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { displayName } from '../auth/profile'
import Avatar from './Avatar'

// Matches the link styling in the header's mobile menu, which these items are rendered into
const itemClasses =
  'flex w-full items-center gap-2 py-2 text-sm font-medium text-white/60 cursor-pointer hover:text-white transition-colors'

const AuthMenuItems = () => {
  const { user, isLoading, login, logout } = useAuth()
  const { profile } = useProfile()

  if (isLoading) return null

  if (!user) {
    return (
      <li>
        <button type="button" className={itemClasses} onClick={() => login()}>
          <LogIn size={18} aria-hidden="true" />
          Logg inn
        </button>
      </li>
    )
  }

  const name = profile?.displayName || displayName(user)

  return (
    <>
      <li className="flex items-center gap-2 pt-2 pb-1 text-[13px] text-white/70">
        <Avatar name={name} image={profile?.avatar} className="h-7 w-7 text-[11px]" />
        <span className="truncate">
          Innlogget som <span className="font-semibold text-white">{name}</span>
        </span>
      </li>
      <li>
        <Link to="/medlem/meg" className={itemClasses}>
          <User size={18} aria-hidden="true" />
          Min profil
        </Link>
      </li>
      <li>
        <Link to="/konto" className={itemClasses}>
          <UserCog size={18} aria-hidden="true" />
          Min konto
        </Link>
      </li>
      <li>
        <button type="button" className={itemClasses} onClick={() => logout()}>
          <LogOut size={18} aria-hidden="true" />
          Logg ut
        </button>
      </li>
    </>
  )
}

export default AuthMenuItems
