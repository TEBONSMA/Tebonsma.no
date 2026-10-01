import { Link } from 'react-router-dom'

const navLinks = [
  { label: 'Hjem', href: '/' },
  { label: 'Feed', href: '/feed' },
  { label: 'Spill', href: '/games' },
  { label: 'Om oss', href: '/about' },
  { label: 'Kontakt', href: '/contact' },
]

const Footer = () => {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 gap-10">
        <div className="space-y-3">
          <span className="text-lg font-bold text-white">TEBONSMA</span>
          <p className="text-sm text-white/60 max-w-xs leading-relaxed">
            En eksklusiv vennegjeng grunnlagt i 2021, dedikert til uforglemmelige øyeblikk og sterke bånd.
          </p>
        </div>

        <div className="sm:justify-self-end">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Navigasjon</h3>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} TEBONSMA. Alle rettigheter reservert.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
