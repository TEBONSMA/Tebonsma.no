import { Link } from 'react-router-dom'
import { LogIn, LogOut, UserCog } from 'lucide-react'
import { useProfile } from '../account/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { displayName } from '../auth/profile'
import Avatar from './Avatar'

// Matches the link styling in PillNav's mobile menu, which these items are rendered into
const itemClasses =
  'flex w-full items-center gap-2 py-3 px-4 text-[16px] font-medium rounded-[50px] cursor-pointer bg-[#ff8c42] text-[#1f2937] hover:bg-transparent hover:text-white transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]'

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
      <li className="flex items-center gap-2 px-4 pt-3 pb-1 text-[13px] text-white/70">
        <Avatar name={name} image={profile?.avatar} className="h-7 w-7 text-[11px]" />
        <span className="truncate">
          Innlogget som <span className="font-semibold text-white">{name}</span>
        </span>
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
