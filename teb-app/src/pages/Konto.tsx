import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, ShieldCheck, Trash2, Upload } from 'lucide-react'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import { useProfile } from '../account/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { ADMIN_GROUP, PASSWORD_URL, USER_ADMIN_URL } from '../auth/userManager'
import { apiFetch, type Profile } from '../lib/api'

const PILL =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const PILL_PRIMARY = `${PILL} bg-teb-orange text-white hover:bg-teb-orange-light`
const PILL_GHOST = `${PILL} border border-white/10 text-white/80 hover:border-white/20 hover:text-white`
const CARD = 'rounded-lg border border-white/10 bg-white/5 p-6 md:p-8 space-y-5'
const INPUT =
  'w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition-colors focus:border-teb-orange'
const AVATAR_SIZE = 256

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

// Center-crop to a square and re-encode as a small JPEG, which is what LLDAP stores
async function toJpegBase64(file: File) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Nettleseren kunne ikke behandle bildet')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="block text-xs text-white/50">{hint}</span>}
    </label>
  )
}

function AvatarEditor({ profile, token, onSaved }: { profile: Profile; token: string; onSaved: (p: Profile) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (request: () => Promise<Profile>) => {
    setBusy(true)
    setError(null)
    try {
      onSaved(await request())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const upload = (file: File) =>
    run(async () => {
      const image = await toJpegBase64(file)
      return apiFetch<Profile>('/me/avatar', token, { method: 'PUT', body: JSON.stringify({ image }) })
    })

  const remove = () => run(() => apiFetch<Profile>('/me/avatar', token, { method: 'DELETE' }))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={profile.displayName || profile.username} image={profile.avatar} className="h-24 w-24 text-2xl" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={PILL_PRIMARY} disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload size={18} aria-hidden="true" />
            {profile.avatar ? 'Bytt bilde' : 'Last opp bilde'}
          </button>
          {profile.avatar && (
            <button type="button" className={PILL_GHOST} disabled={busy} onClick={remove}>
              <Trash2 size={18} aria-hidden="true" />
              Fjern
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) upload(file)
            }}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}

function ProfileCard({ profile, token, onSaved }: { profile: Profile; token: string; onSaved: (p: Profile) => void }) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [status, setStatus] = useState<{ kind: 'saving' | 'saved' | 'error'; message?: string } | null>(null)

  const dirty =
    displayName.trim() !== profile.displayName ||
    firstName.trim() !== profile.firstName ||
    lastName.trim() !== profile.lastName

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'saving' })
    try {
      const updated = await apiFetch<Profile>('/me', token, {
        method: 'PATCH',
        body: JSON.stringify({ displayName, firstName, lastName }),
      })
      onSaved(updated)
      setDisplayName(updated.displayName)
      setFirstName(updated.firstName)
      setLastName(updated.lastName)
      setStatus({ kind: 'saved' })
    } catch (err) {
      setStatus({ kind: 'error', message: errorMessage(err) })
    }
  }

  return (
    <Card title="Profil">
      <AvatarEditor profile={profile} token={token} onSaved={onSaved} />

      <form onSubmit={save} className="space-y-4">
        <Field label="Visningsnavn">
          <input className={INPUT} value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={64} required />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fornavn">
            <input className={INPUT} value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={64} />
          </Field>
          <Field label="Etternavn">
            <input className={INPUT} value={lastName} onChange={e => setLastName(e.target.value)} maxLength={64} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Brukernavn">
            <input className={`${INPUT} opacity-60`} value={profile.username} readOnly />
          </Field>
          <Field label="E-post" hint="E-posten er også innloggingen din til e-post, så den kan bare endres av en administrator.">
            <input className={`${INPUT} opacity-60`} value={profile.email} readOnly />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="submit" className={PILL_PRIMARY} disabled={!dirty || status?.kind === 'saving'}>
            {status?.kind === 'saving' ? 'Lagrer…' : 'Lagre endringer'}
          </button>
          {status?.kind === 'saved' && !dirty && <span className="text-sm text-green-300">Lagret</span>}
          {status?.kind === 'error' && <span className="text-sm text-red-300">{status.message}</span>}
        </div>
      </form>

      {profile.groups.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Grupper</p>
          <div className="flex flex-wrap gap-2">
            {profile.groups.map(group => (
              <span key={group} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
                {group}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default function Konto() {
  const { user, isLoading, login } = useAuth()
  const { profile, error, retry, setProfile } = useProfile()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  let content: ReactNode
  if (isLoading) {
    content = <p className="text-center text-white/60">Laster…</p>
  } else if (!user) {
    content = (
      <Card title="Logg inn">
        <p className="text-white/70">Logg inn med TEBONSMA-kontoen din for å se og endre profilen din.</p>
        <button type="button" className={PILL_PRIMARY} onClick={() => login()}>
          Logg inn
        </button>
      </Card>
    )
  } else if (error && !profile) {
    const expired = error.status === 401
    content = (
      <Card title="Noe gikk galt">
        <p className="text-white/70">{expired ? 'Økten din har utløpt. Logg inn på nytt.' : error.message}</p>
        <button type="button" className={PILL_PRIMARY} onClick={expired ? () => login() : retry}>
          {expired ? 'Logg inn på nytt' : 'Prøv igjen'}
        </button>
      </Card>
    )
  } else if (!profile) {
    content = <p className="text-center text-white/60">Henter kontoen din…</p>
  } else {
    content = (
      <>
        <ProfileCard key={profile.username} profile={profile} token={user.access_token} onSaved={setProfile} />
        <Card title="Passord">
          <p className="text-white/70">
            Passordet endrer du hos innloggingstjenesten. Det nye passordet gjelder også for e-posten din.
          </p>
          <a href={PASSWORD_URL} target="_blank" rel="noopener noreferrer" className={PILL_PRIMARY}>
            <KeyRound size={18} aria-hidden="true" />
            Endre passord
          </a>
        </Card>
        {profile.groups.includes(ADMIN_GROUP) && (
          <Card title="Administrasjon">
            <p className="text-white/70">Brukere og grupper administreres i LLDAP.</p>
            <a href={USER_ADMIN_URL} target="_blank" rel="noopener noreferrer" className={PILL_GHOST}>
              <ShieldCheck size={18} aria-hidden="true" />
              Brukeradministrasjon
            </a>
          </Card>
        )}
      </>
    )
  }

  return (
    <Layout mainClassName="w-full max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6 text-center">
        <Badge>Konto</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Min konto</h1>
      </div>
      {content}
    </Layout>
  )
}
