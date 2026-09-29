import { LogIn, LogOut, UserCog } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { displayName } from '../auth/profile'
import { ACCOUNT_URL } from '../auth/userManager'

// Matches the link styling in PillNav's mobile menu, which these items are rendered into
const itemClasses =
  'flex w-full items-center gap-2 py-3 px-4 text-[16px] font-medium rounded-[50px] cursor-pointer bg-[#ff8c42] text-[#1f2937] hover:bg-transparent hover:text-white transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]'

const AuthMenuItems = () => {
  const { user, isLoading, login, logout } = useAuth()

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

  return (
    <>
      <li className="px-4 pt-3 pb-1 text-[13px] text-white/70 truncate">
        Innlogget som <span className="font-semibold text-white">{displayName(user)}</span>
      </li>
      <li>
        <a href={ACCOUNT_URL} target="_blank" rel="noopener noreferrer" className={itemClasses}>
          <UserCog size={18} aria-hidden="true" />
          Min konto
        </a>
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
