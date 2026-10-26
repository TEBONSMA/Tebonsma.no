import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../Badge'
import Layout from '../Layout'
import { BUTTON_PRIMARY, CARD } from '../feed/styles'
import { useAuth } from '../../auth/AuthContext'

const TABS = [
  { key: 'tekst', label: 'Vedtektene', short: 'Vedtektene', to: '/vedtekter' },
  { key: 'forslag', label: 'Forslag til endringer', short: 'Forslag', to: '/vedtekter/forslag' },
  { key: 'arsmote', label: 'Årsmøte', short: 'Årsmøte', to: '/vedtekter/arsmote' },
] as const

// The pages about the vedtekter: for members only, with the text and the proposals as tabs. A
// wide page uses more of a computer screen.
export default function VedtekterLayout({
  tab,
  wide = false,
  children,
}: {
  tab: (typeof TABS)[number]['key']
  wide?: boolean
  children: (token: string) => ReactNode
}) {
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null

  return (
    <Layout mainClassName={`w-full ${wide ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 pt-5 pb-12 md:pt-24 md:pb-16`}>
      <div className="flex flex-col items-center gap-4 text-center">
        {/* On a phone the title is enough; the page starts right under the header */}
        <span className="hidden md:block">
          <Badge>Vedtekter</Badge>
        </span>
        <h1 className="text-3xl md:text-6xl font-bold text-teb-orange tracking-tight">Vedtektene</h1>
        <p className="hidden md:block text-white/70 max-w-xl">Reglene TEBONSMA er bygget på. Bare for medlemmer.</p>
      </div>

      {!token ? (
        <div className={`${CARD} mx-auto mt-6 md:mt-10 max-w-md p-6 text-center`}>
          <p className="text-sm text-white/70">Logg inn for å lese vedtektene.</p>
          <button type="button" className={`${BUTTON_PRIMARY} mt-4`} onClick={() => login()} disabled={isLoading}>
            Logg inn
          </button>
        </div>
      ) : (
        <>
          <nav aria-label="Vedtekter" className="mt-3 md:mt-8 flex justify-center gap-1 border-b border-white/10">
            {TABS.map(item => (
              <Link
                key={item.key}
                to={item.to}
                aria-current={item.key === tab ? 'page' : undefined}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                  item.key === tab ? 'border-teb-orange text-white' : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
          {children(token)}
        </>
      )}
    </Layout>
  )
}
