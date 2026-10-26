import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../Badge'
import Layout from '../Layout'
import { BUTTON_PRIMARY, CARD } from '../feed/styles'
import { useAuth } from '../../auth/AuthContext'

const TABS = [
  { key: 'tekst', label: 'Vedtektene', to: '/vedtekter' },
  { key: 'forslag', label: 'Forslag til endringer', to: '/vedtekter/forslag' },
] as const

// The pages about the vedtekter: for members only, with the text and the proposals as tabs
export default function VedtekterLayout({ tab, children }: { tab: 'tekst' | 'forslag'; children: (token: string) => ReactNode }) {
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null

  return (
    <Layout mainClassName="w-full max-w-5xl mx-auto px-4 pt-24 pb-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge>Vedtekter</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Vedtektene</h1>
        <p className="text-white/70 max-w-xl">Reglene TEBONSMA er bygget på. Bare for medlemmer.</p>
      </div>

      {!token ? (
        <div className={`${CARD} mx-auto mt-10 max-w-md p-6 text-center`}>
          <p className="text-sm text-white/70">Logg inn for å lese vedtektene.</p>
          <button type="button" className={`${BUTTON_PRIMARY} mt-4`} onClick={() => login()} disabled={isLoading}>
            Logg inn
          </button>
        </div>
      ) : (
        <>
          <nav aria-label="Vedtekter" className="mt-8 flex justify-center gap-1 border-b border-white/10">
            {TABS.map(item => (
              <Link
                key={item.key}
                to={item.to}
                aria-current={item.key === tab ? 'page' : undefined}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  item.key === tab ? 'border-teb-orange text-white' : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children(token)}
        </>
      )}
    </Layout>
  )
}
