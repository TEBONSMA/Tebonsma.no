import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { TEBBET_URL } from '../lib/tebbet'
import AuthButton from './AuthButton'
import AuthMenuItems from './AuthMenuItems'
import NotificationBell from './feed/NotificationBell'
import { useNotifications } from './feed/NotificationsContext'

const navItems = [
  { label: 'Hjem', href: '/' },
  { label: 'Feed', href: '/feed' },
  { label: 'Kalender', href: '/kalender' },
  { label: 'Spill', href: '/games' },
  { label: 'Om oss', href: '/about' },
]

// Mail is the member's own mailbox, so it is only in the menu when someone is logged in
const MAIL_ITEM = { label: 'Mail', href: '/mail' }

// The number of unread mails next to Mail in the menu
const UnreadBadge = ({ count }: { count: number }) =>
  count > 0 && (
    <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-teb-orange px-1 text-[11px] font-bold text-white" aria-label={`${count} uleste`}>
      {count > 99 ? '99+' : count}
    </span>
  )

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)

const Header = () => {
  const location = useLocation()
  const { user } = useAuth()
  const { mailUnread } = useNotifications()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const items = user ? [...navItems.slice(0, 3), MAIL_ITEM, ...navItems.slice(3)] : navItems

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
      {/* Three columns, the outer two always equally wide, so the menu sits in the middle
          whatever the logo and the buttons on the right take up */}
      <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0 justify-self-start" onClick={() => setIsMenuOpen(false)}>
          <img src="/images/Jarritos-PNG-Pic.png" alt="TEBONSMA" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-lg font-bold text-white tracking-tight">TEBONSMA</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex col-start-2 items-center gap-5 lg:gap-6 xl:gap-8">
          {items.map((item) => {
            const active = isActive(location.pathname, item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative py-2 text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
                {item === MAIL_ITEM && <UnreadBadge count={mailUnread} />}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-teb-orange rounded-full" />
                )}
              </Link>
            )
          })}
          {/* Members only, since betting needs a login */}
          {user && (
            <a href={TEBBET_URL} className="relative py-2 text-sm font-medium text-white/60 transition-colors hover:text-white">
              TebBet
            </a>
          )}
        </nav>

        <div className="col-start-3 justify-self-end flex items-center gap-2 md:gap-3">
          <Link
            to="/contact"
            className="hidden md:inline-flex items-center rounded-md bg-teb-orange px-4 py-2 text-sm font-semibold text-white hover:bg-teb-orange-light transition-colors"
          >
            Kontakt oss
          </Link>
          <NotificationBell />
          <div className="hidden md:block">
            <AuthButton />
          </div>
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Åpne meny"
            aria-expanded={isMenuOpen}
            className="md:hidden text-white/80 hover:text-white p-2 -mr-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav aria-label="Mobil" className="md:hidden border-t border-white/10 bg-neutral-950 px-6 py-4 flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(location.pathname, item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 text-sm font-medium ${active ? 'text-white' : 'text-white/60'}`}
              >
                {item.label}
                {item === MAIL_ITEM && <UnreadBadge count={mailUnread} />}
              </Link>
            )
          })}
          {user && (
            <a href={TEBBET_URL} className="py-2 text-sm font-medium text-white/60">
              TebBet
            </a>
          )}
          <Link
            to="/contact"
            onClick={() => setIsMenuOpen(false)}
            className="mt-3 inline-flex items-center justify-center rounded-md bg-teb-orange px-4 py-2 text-sm font-semibold text-white"
          >
            Kontakt oss
          </Link>
          <ul className="mt-3 flex flex-col gap-2" onClick={() => setIsMenuOpen(false)}>
            <AuthMenuItems />
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Header
