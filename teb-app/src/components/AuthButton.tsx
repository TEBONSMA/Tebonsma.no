import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogIn, LogOut, UserCog } from 'lucide-react'
import { useProfile } from '../account/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { displayName } from '../auth/profile'
import Avatar from './Avatar'

const ringClasses = 'h-9'
const pillClasses =
  'h-full rounded-md inline-flex items-center gap-2 border border-white/10 text-sm font-semibold text-white cursor-pointer transition-colors hover:border-white/20 hover:bg-white/5'
const menuItemClasses =
  'flex w-full items-center gap-2 py-2 px-3 text-sm font-medium text-white/80 rounded-md cursor-pointer transition-colors hover:bg-white/10 hover:text-white'

// Shown from the md breakpoint up: a round button until lg, where there is room for text
const AuthButton = () => {
  const { user, isLoading, login, logout } = useAuth()
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (isLoading) return null

  if (!user) {
    return (
      <div className={ringClasses}>
        <button
          type="button"
          onClick={() => login()}
          aria-label="Logg inn"
          className={`${pillClasses} px-2.5 lg:px-4`}
        >
          <LogIn size={18} aria-hidden="true" className="lg:hidden" />
          <span className="hidden lg:inline">Logg inn</span>
        </button>
      </div>
    )
  }

  // The account API has the current name and picture; Authelia's copy can lag behind edits
  const name = profile?.displayName || displayName(user)
  const email = profile?.email ?? user.profile.email

  return (
    <div ref={rootRef} className="relative">
      <div className={ringClasses}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Innlogget som ${name}`}
          className={`${pillClasses} p-1 lg:pr-3`}
        >
          <Avatar name={name} image={profile?.avatar} className="h-full aspect-square text-[12px]" />
          <span className="hidden lg:inline">{name.split(/\s+/)[0]}</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`hidden lg:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-[240px] rounded-lg p-1 bg-neutral-950/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        >
          <div className="px-3 pt-2 pb-2 mb-1 border-b border-white/10">
            <p className="font-semibold text-white truncate">{name}</p>
            {email && <p className="text-[13px] text-white/60 truncate">{email}</p>}
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              role="menuitem"
              to="/konto"
              className={menuItemClasses}
              onClick={() => setOpen(false)}
            >
              <UserCog size={18} aria-hidden="true" />
              Min konto
            </Link>
            <button
              type="button"
              role="menuitem"
              className={menuItemClasses}
              onClick={() => logout()}
            >
              <LogOut size={18} aria-hidden="true" />
              Logg ut
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthButton
