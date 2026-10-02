import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AuthButton from './AuthButton'
import AuthMenuItems from './AuthMenuItems'
import NotificationBell from './feed/NotificationBell'

const navItems = [
  { label: 'Hjem', href: '/' },
  { label: 'Feed', href: '/feed' },
  { label: 'Spill', href: '/games' },
  { label: 'Om oss', href: '/about' },
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)

const Header = () => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setIsMenuOpen(false)}>
          <img src="/images/Jarritos-PNG-Pic.png" alt="TEBONSMA" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-lg font-bold text-white tracking-tight">TEBONSMA</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
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
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-teb-orange rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
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
          {navItems.map((item) => {
            const active = isActive(location.pathname, item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 text-sm font-medium ${active ? 'text-white' : 'text-white/60'}`}
              >
                {item.label}
              </Link>
            )
          })}
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
