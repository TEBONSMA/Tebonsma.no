import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogIn, LogOut, UserCog } from 'lucide-react'
import { useProfile } from '../account/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { displayName } from '../auth/profile'
import Avatar from './Avatar'

const PILL_BG = '#ff8c42'
const PILL_TEXT = '#1f2937'

const ringClasses = 'h-[52px] rounded-full p-[3px] backdrop-blur-sm bg-white/10 border border-white/20'
const pillClasses =
  'h-full rounded-full inline-flex items-center gap-2 font-semibold uppercase tracking-[0.2px] cursor-pointer transition-[filter] duration-200 hover:brightness-110'
const menuItemClasses =
  'flex w-full items-center gap-2 py-3 px-4 text-[16px] font-medium rounded-[50px] cursor-pointer transition-[filter] duration-200 hover:brightness-110'

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
          className={`${pillClasses} px-[12px] lg:px-[22px] text-[18px]`}
          style={{ background: PILL_BG, color: PILL_TEXT }}
        >
          <LogIn size={20} aria-hidden="true" className="lg:hidden" />
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
          className={`${pillClasses} px-0 lg:pl-0 lg:pr-4`}
          style={{ background: PILL_BG, color: PILL_TEXT }}
        >
          <Avatar name={name} image={profile?.avatar} className="h-full aspect-square text-[15px]" />
          <span className="hidden lg:inline text-[18px]">{name.split(/\s+/)[0]}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`hidden lg:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-[240px] rounded-[27px] p-[3px] backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          style={{ background: 'rgba(15, 14, 58, 0.85)' }}
        >
          <div className="px-4 pt-2 pb-3">
            <p className="font-semibold text-white truncate">{name}</p>
            {email && <p className="text-[13px] text-white/60 truncate">{email}</p>}
          </div>
          <div className="flex flex-col gap-[3px]">
            <Link
              role="menuitem"
              to="/konto"
              className={menuItemClasses}
              style={{ background: PILL_BG, color: PILL_TEXT }}
              onClick={() => setOpen(false)}
            >
              <UserCog size={18} aria-hidden="true" />
              Min konto
            </Link>
            <button
              type="button"
              role="menuitem"
              className={menuItemClasses}
              style={{ background: PILL_BG, color: PILL_TEXT }}
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
