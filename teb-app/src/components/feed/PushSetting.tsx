import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../lib/feed'
import { pushState, turnOffPush, turnOnPush, type PushState } from '../../lib/push'
import { ERROR_TEXT } from './styles'

const TEXT: Record<Exclude<PushState, 'unsupported'>, string> = {
  off: 'Få varslene på denne enheten, også når siden er lukket.',
  on: 'Varslene kommer på denne enheten.',
  denied: 'Varsler er blokkert for siden. Slå dem på i nettleserens innstillinger.',
  install: 'På iPhone og iPad: trykk Del, velg «Legg til på Hjem-skjerm» og åpne TEBONSMA derfra for å få varslene.',
}

// Push notifications on this device, at the bottom of the bell's menu
const PushSetting = ({ token, onLeave }: { token: string; onLeave: () => void }) => {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void pushState().then(next => {
      if (active) setState(next)
    })
    return () => {
      active = false
    }
  }, [])

  if (!state || state === 'unsupported') return null

  const toggle = () => {
    setBusy(true)
    setError(null)
    // Straight from the tap, or an iPhone won't ask for permission
    ;(state === 'on' ? turnOffPush(token) : turnOnPush(token))
      .catch(err => setError(errorMessage(err)))
      .then(pushState)
      .then(setState)
      .finally(() => setBusy(false))
  }

  return (
    <div className="border-t border-white/10 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-xs text-white/60">{TEXT[state]}</p>
        {(state === 'off' || state === 'on') && (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className="shrink-0 rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {state === 'on' ? 'Slå av' : 'Slå på'}
          </button>
        )}
      </div>
      {(state === 'install' || state === 'off') && (
        <Link to="/app" onClick={onLeave} className="mt-1 inline-block text-xs text-teb-orange hover:underline">
          Slik installerer du appen
        </Link>
      )}
      {error && <p className={`mt-1 ${ERROR_TEXT}`}>{error}</p>}
    </div>
  )
}

export default PushSetting
