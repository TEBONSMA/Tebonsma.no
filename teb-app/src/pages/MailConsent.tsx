import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import { BUTTON_PRIMARY, CARD, ERROR_TEXT } from '../components/feed/styles'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../lib/feed'
import { finishOffline } from '../lib/mail'

// A code from the login provider can only be used once, and StrictMode runs effects twice in dev
const exchanges = new Map<string, Promise<unknown>>()

// Where the login provider sends the member after they have said yes to sending mail later
export default function MailConsent() {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get('code')
  const state = params.get('state')
  const refused = params.get('error')
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (!token || !code || !state) return
    let active = true
    const exchange = exchanges.get(state) ?? finishOffline(token, code, state)
    exchanges.set(state, exchange)
    exchange
      .then(() => {
        if (!active) return
        setOutcome({ ok: true, message: 'Tillatelsen er gitt. Mailen din ligger i Kladder, og du kan nå velge «Send senere».' })
        // Back to the mail after a moment
        setTimeout(() => navigate('/mail/drafts', { replace: true }), 2500)
      })
      .catch(err => active && setOutcome({ ok: false, message: errorMessage(err) }))
    return () => {
      active = false
    }
  }, [token, code, state, navigate])

  const missing = !refused && (!code || !state)
  const failure = refused ? 'Tillatelsen ble ikke gitt.' : missing ? 'Fant ikke noe å fullføre. Start på nytt fra «Send senere».' : outcome && !outcome.ok ? outcome.message : null

  return (
    <Layout mainClassName="w-full max-w-xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge>Mail</Badge>
        <h1 className="text-3xl md:text-5xl font-bold text-teb-orange tracking-tight">Send senere</h1>
      </div>
      <section className={`${CARD} space-y-4 p-5 text-center md:p-6`}>
        {failure ? (
          <>
            <p className={ERROR_TEXT}>{failure}</p>
            <Link to="/mail" className={BUTTON_PRIMARY}>
              Til mailen
            </Link>
          </>
        ) : outcome?.ok ? (
          <p className="text-sm text-emerald-300">{outcome.message}</p>
        ) : (
          <p className="text-sm text-white/60">{isLoading || !token ? 'Logger inn…' : 'Fullfører…'}</p>
        )}
      </section>
    </Layout>
  )
}
