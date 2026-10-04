import { useRef, useState } from 'react'
import { CalendarSync, Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { getCalendarFeed, googleSubscribeUrl, resetCalendarFeed, webcalUrl } from '../../lib/calendarExport'
import { errorMessage } from '../../lib/feed'
import { BUTTON_PRIMARY, ERROR_TEXT, MENU, MENU_ITEM } from '../feed/styles'
import { useDismiss } from '../feed/useDismiss'

interface Feed {
  // Whether it is a member's own, which has the closed events too
  personal: boolean
  url: string
}

// Adds the whole calendar to the viewer's own calendar app as a subscription, which the app
// keeps up to date by itself
const SubscribeCalendar = ({ token }: { token: string | null }) => {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState<Feed | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, open, () => setOpen(false))

  // Logging in or out changes which calendar it is
  const personal = !!token
  const feed = loaded?.personal === personal ? loaded : null

  const load = (fetchUrl: Promise<string>) => {
    setError(null)
    fetchUrl.then(url => setLoaded({ personal, url })).catch(err => setError(errorMessage(err)))
  }

  const toggle = () => {
    setOpen(!open)
    if (!open && !feed) load(getCalendarFeed(token))
  }

  const copy = async () => {
    if (!feed) return
    try {
      await navigator.clipboard.writeText(feed.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Fikk ikke kopiert lenken')
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button type="button" className={BUTTON_PRIMARY} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
        <CalendarSync size={16} aria-hidden="true" />
        Abonner
      </button>
      {open && (
        <div role="menu" className={`${MENU} right-0 top-[calc(100%+4px)] w-64 max-w-[calc(100vw-2rem)]`}>
          {feed && (
            <>
              <a role="menuitem" className={MENU_ITEM} href={webcalUrl(feed.url)} onClick={() => setOpen(false)}>
                <ExternalLink size={16} aria-hidden="true" />
                Apple Kalender
              </a>
              <a
                role="menuitem"
                className={MENU_ITEM}
                href={googleSubscribeUrl(feed.url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <ExternalLink size={16} aria-hidden="true" />
                Google Kalender
              </a>
              <button type="button" role="menuitem" className={MENU_ITEM} onClick={copy}>
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? 'Kopiert' : 'Kopier lenke'}
              </button>
              {token && (
                <>
                  <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => load(resetCalendarFeed(token))}>
                    <RefreshCw size={16} aria-hidden="true" />
                    Lag ny lenke
                  </button>
                  <p className="px-3 py-2 text-xs text-white/40">
                    Lenken er din egen og viser lukkede arrangementer. Har den kommet på avveie, lag en ny; den gamle slutter da å virke.
                  </p>
                </>
              )}
            </>
          )}
          {!feed && !error && <p className="px-3 py-2 text-sm text-white/50">Laster…</p>}
          {error && <p className={`${ERROR_TEXT} px-3 py-2`}>{error}</p>}
        </div>
      )}
    </div>
  )
}

export default SubscribeCalendar
