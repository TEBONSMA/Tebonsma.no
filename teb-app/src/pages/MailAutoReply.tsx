import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import { BUTTON_DANGER, BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT } from '../components/feed/styles'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../lib/feed'
import {
  getAutoReply,
  getMailSettings,
  getOfflineStatus,
  revokeOffline,
  saveAutoReply,
  saveMailSettings,
  startOffline,
  type AutoReply,
  type MailSettings,
  type OfflineStatus,
} from '../lib/mail'

// The editor is large and only needed for the signature
const RichEditor = lazy(() => import('../components/mail/RichEditor'))

const UNDO_CHOICES = [
  { value: 0, label: 'Ingen (sendes med en gang)' },
  { value: 5, label: '5 sekunder' },
  { value: 10, label: '10 sekunder' },
  { value: 30, label: '30 sekunder' },
]

type Status = { kind: 'saved' | 'error'; text: string } | null

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className={`${CARD} space-y-4 p-5 md:p-6`}>
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white/80">
        {label}
      </label>
      {children}
    </div>
  )
}

const StatusLine = ({ status }: { status: Status }) =>
  status && <p className={status.kind === 'error' ? ERROR_TEXT : 'text-sm text-emerald-300'}>{status.text}</p>

export default function MailAutoReply() {
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null

  const [reply, setReply] = useState<AutoReply | null>(null)
  const [settings, setSettings] = useState<MailSettings | null>(null)
  const [offline, setOffline] = useState<OfflineStatus | null>(null)
  const [offlineError, setOfflineError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [replyStatus, setReplyStatus] = useState<Status>(null)
  const [settingsStatus, setSettingsStatus] = useState<Status>(null)
  const [saving, setSaving] = useState<'reply' | 'settings' | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    Promise.all([getAutoReply(token), getMailSettings(token), getOfflineStatus(token)])
      .then(([loadedReply, loadedSettings, status]) => {
        if (!active) return
        setReply(loadedReply)
        setSettings(loadedSettings)
        setOffline(status)
      })
      .catch(err => active && setLoadError(errorMessage(err)))
    return () => {
      active = false
    }
  }, [token])

  const submitReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || !reply) return
    setSaving('reply')
    setReplyStatus(null)
    try {
      setReply(await saveAutoReply(token, reply))
      setReplyStatus({ kind: 'saved', text: reply.enabled ? 'Autosvaret er på' : 'Autosvaret er av' })
    } catch (err) {
      setReplyStatus({ kind: 'error', text: errorMessage(err) })
    } finally {
      setSaving(null)
    }
  }

  const changePermission = async () => {
    if (!token || !offline) return
    setOfflineError(null)
    try {
      if (offline.enabled) setOffline(await revokeOffline(token))
      else window.location.href = (await startOffline(token)).url
    } catch (err) {
      setOfflineError(errorMessage(err))
    }
  }

  const submitSettings = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || !settings) return
    setSaving('settings')
    setSettingsStatus(null)
    try {
      setSettings(await saveMailSettings(token, settings))
      setSettingsStatus({ kind: 'saved', text: 'Lagret' })
    } catch (err) {
      setSettingsStatus({ kind: 'error', text: errorMessage(err) })
    } finally {
      setSaving(null)
    }
  }

  return (
    <Layout mainClassName="w-full max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6 text-center">
        <Badge>Mail</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Autosvar og innstillinger</h1>
      </div>

      <Link to="/mail" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" />
        Tilbake til mailen
      </Link>

      {!token && !isLoading && (
        <section className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4 md:p-5`}>
          <p className="text-sm text-white/70">Logg inn for å endre innstillingene for mailen din.</p>
          <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
            Logg inn
          </button>
        </section>
      )}
      {loadError && <p className={ERROR_TEXT}>{loadError}</p>}
      {token && !loadError && (!reply || !settings) && <p className="text-sm text-white/50">Laster…</p>}

      {reply && (
        <form onSubmit={submitReply}>
          <Section
            title="Autosvar"
            description="Svarer for deg når du får mail, også når du er logget ut. Hver avsender får svar én gang hvert fjerde døgn, og lister og automatiske mails får ikke svar."
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[var(--color-teb-orange)]"
                checked={reply.enabled}
                onChange={e => setReply({ ...reply, enabled: e.target.checked })}
              />
              Slå på autosvar
            </label>
            <Field label="Emne" htmlFor="auto-subject">
              <input id="auto-subject" className={INPUT} value={reply.subject} maxLength={200} onChange={e => setReply({ ...reply, subject: e.target.value })} placeholder="Borte fra jobb" />
            </Field>
            <Field label="Tekst" htmlFor="auto-body">
              <textarea
                id="auto-body"
                className={`${INPUT} min-h-32`}
                value={reply.body}
                maxLength={2000}
                onChange={e => setReply({ ...reply, body: e.target.value })}
                placeholder="Hei! Jeg er borte og svarer når jeg er tilbake."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fra og med (valgfritt)" htmlFor="auto-from">
                <input id="auto-from" type="date" className={INPUT} value={reply.from ?? ''} onChange={e => setReply({ ...reply, from: e.target.value || null })} />
              </Field>
              <Field label="Til og med (valgfritt)" htmlFor="auto-to">
                <input id="auto-to" type="date" className={INPUT} value={reply.to ?? ''} min={reply.from ?? undefined} onChange={e => setReply({ ...reply, to: e.target.value || null })} />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={BUTTON_PRIMARY} disabled={saving === 'reply'}>
                {saving === 'reply' ? 'Lagrer…' : 'Lagre autosvar'}
              </button>
              <StatusLine status={replyStatus} />
            </div>
          </Section>
        </form>
      )}

      {settings && (
        <form onSubmit={submitSettings}>
          <Section title="Innstillinger" description="Gjelder bare på tebonsma.no. Signaturen settes inn i nye mails, og du kan endre den mens du skriver.">
            <Field label="Signatur" htmlFor="signature">
              <Suspense fallback={<div className="min-h-32 rounded-md border border-white/10 bg-white/5" />}>
                <RichEditor initialHtml={settings.signature} onChange={html => setSettings(current => (current ? { ...current, signature: html } : current))} />
              </Suspense>
            </Field>
            <Field label="Angre sending" htmlFor="undo">
              <select id="undo" className={`${INPUT} cursor-pointer`} value={settings.undoSeconds} onChange={e => setSettings({ ...settings, undoSeconds: Number(e.target.value) })}>
                {UNDO_CHOICES.map(choice => (
                  <option key={choice.value} value={choice.value} className="bg-neutral-900">
                    {choice.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[var(--color-teb-orange)]"
                checked={settings.conversations}
                onChange={e => setSettings({ ...settings, conversations: e.target.checked })}
              />
              Vis mail i samtaler
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={BUTTON_PRIMARY} disabled={saving === 'settings'}>
                {saving === 'settings' ? 'Lagrer…' : 'Lagre innstillinger'}
              </button>
              <StatusLine status={settingsStatus} />
            </div>
          </Section>
        </form>
      )}

      {offline?.available && (
        <Section
          title="Send senere"
          description="For at en planlagt mail skal gå til riktig tid også når du er logget ut, lagrer tebonsma.no et innlogging for deg, kryptert. Uten tillatelsen lagres ingenting, og du kan trekke den tilbake når som helst."
        >
          <p className="text-sm text-white/80">{offline.enabled ? 'Du har gitt tillatelse.' : 'Du har ikke gitt tillatelse.'}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={offline.enabled ? BUTTON_DANGER : BUTTON_GHOST} onClick={changePermission}>
              {offline.enabled ? 'Trekk tillatelsen' : 'Gi tillatelse'}
            </button>
            {offlineError && <p className={ERROR_TEXT}>{offlineError}</p>}
          </div>
          {offline.enabled && <p className="text-xs text-white/40">Mail som venter på å bli sendt når du trekker tillatelsen, havner i Kladder.</p>}
        </Section>
      )}
    </Layout>
  )
}
