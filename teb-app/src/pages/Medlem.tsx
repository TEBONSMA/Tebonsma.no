import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { UserCog } from 'lucide-react'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import PostCard from '../components/feed/PostCard'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT } from '../components/feed/styles'
import { useMemberPosts } from '../components/profile/useMemberPosts'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { getGameBySlug } from '../lib/games'
import { cn } from '../lib/utils'
import { OWN_PROFILE, formatCoins, getMemberProfile, memberPath, type MemberProfile, type PostKind } from '../lib/memberProfile'
import { TEBBET_URL } from '../lib/tebbet'

const PAGE_SIZE = 10
const day = new Intl.DateTimeFormat('nb', { day: 'numeric', month: 'short', year: 'numeric' })

const TABS: { kind: PostKind; label: string; empty: string }[] = [
  { kind: 'posts', label: 'Innlegg', empty: 'har ikke skrevet noen innlegg ennå.' },
  { kind: 'events', label: 'Arrangementer', empty: 'har ikke lagt ut noen arrangementer ennå.' },
]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  )
}

function CoinsCard({ profile }: { profile: MemberProfile }) {
  const { coins, member, isYou } = profile
  return (
    <section className={cn(CARD, 'space-y-4 p-5 md:p-6')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">TEB-coins</h2>
        <a href={`${TEBBET_URL}/medlem/${encodeURIComponent(member.id)}`} className={BUTTON_GHOST}>
          {isYou ? 'Mine spill på TebBet' : 'Se spillene på TebBet'}
        </a>
      </div>
      {coins ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Saldo" value={formatCoins(coins.balance)} />
            <Stat label="I aktive spill" value={formatCoins(coins.inPlay)} />
            <Stat label="Formue" value={formatCoins(coins.total)} />
            <Stat label="Plass på TebBet" value={`#${coins.rank}`} />
          </div>
          <p className="text-xs text-white/40">Formue er coins i hånden pluss coins i aktive spill. Coins er bare for moro.</p>
        </>
      ) : (
        <p className="text-sm text-white/60">
          {isYou ? 'Du har ikke åpnet TebBet ennå. Alle starter med 1 000 coins.' : `${member.name} har ikke åpnet TebBet ennå.`}
        </p>
      )}
    </section>
  )
}

function RecordsCard({ profile }: { profile: MemberProfile }) {
  return (
    <section className={cn(CARD, 'space-y-4 p-5 md:p-6')}>
      <h2 className="text-xl font-semibold text-white">Rekorder</h2>
      <ul className="divide-y divide-white/10">
        {profile.records.map(({ game, players, record }) => {
          const config = getGameBySlug(game)
          return (
            <li key={game} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
              <Link to={`/games/${game}`} className="font-semibold text-white hover:underline">
                {config?.title ?? game}
              </Link>
              {record ? (
                <p className="flex flex-wrap items-baseline gap-x-3 text-sm text-white/60">
                  <span className="text-xl font-bold tabular-nums text-white">{formatCoins(record.score)}</span>
                  <span>
                    <span className="font-semibold text-teb-orange">Plass {record.rank}</span> av {players}
                  </span>
                  <time dateTime={record.date} className="text-xs text-white/40">
                    {day.format(new Date(record.date))}
                  </time>
                </p>
              ) : (
                <p className="text-sm text-white/40">Ikke spilt ennå</p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Posts({ token, id, profile }: { token: string; id: string; profile: MemberProfile }) {
  const [kind, setKind] = useState<PostKind>('posts')
  // Kept here so that deleting a post lowers the number on its tab
  const [counts, setCounts] = useState(profile.counts)
  const { posts, error, hasMore, loadingMore, loadMore, retry, change, remove } = useMemberPosts(token, id, kind, PAGE_SIZE)
  const tab = TABS.find(t => t.kind === kind)!

  const removePost = (postId: string) => {
    remove(postId)
    setCounts(shown => ({ ...shown, [kind]: Math.max(0, shown[kind] - 1) }))
  }

  return (
    <section className="space-y-4">
      <div role="tablist" className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.kind}
            type="button"
            role="tab"
            aria-selected={kind === t.kind}
            onClick={() => setKind(t.kind)}
            className={cn(
              'cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-colors',
              kind === t.kind ? 'bg-teb-orange text-white' : 'border border-white/10 text-white/70 hover:text-white',
            )}
          >
            {t.label} · {counts[t.kind]}
          </button>
        ))}
      </div>

      {!posts && !error && <p className="py-8 text-center text-white/60">Laster…</p>}
      {posts?.map(post => <PostCard key={post.id} post={post} onChange={change} onDelete={removePost} />)}
      {posts?.length === 0 && !error && (
        <p className="py-8 text-center text-white/60">
          {profile.isYou ? 'Du' : profile.member.name} {tab.empty}
        </p>
      )}
      {error && (
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className={ERROR_TEXT}>{error}</p>
          <button type="button" className={BUTTON_GHOST} onClick={retry}>
            Prøv igjen
          </button>
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center">
          <button type="button" className={BUTTON_GHOST} disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Laster…' : 'Vis flere'}
          </button>
        </div>
      )}
    </section>
  )
}

interface Loaded {
  id: string
  profile: MemberProfile | null
  error: ApiError | null
}

export default function Medlem() {
  const { id = OWN_PROFILE } = useParams()
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    if (!token) return
    let active = true
    getMemberProfile(token, id)
      .then(profile => active && setLoaded({ id, profile, error: null }))
      .catch(err => active && setLoaded({ id, profile: null, error: err instanceof ApiError ? err : new ApiError(String(err), 0) }))
    return () => {
      active = false
    }
  }, [token, id, attempt])

  const current = loaded?.id === id ? loaded : null
  const profile = current?.profile ?? null

  // Your own page has an address of its own to share
  if (id === OWN_PROFILE && profile) return <Navigate to={memberPath(profile.member.id)} replace />

  let content
  if (isLoading) {
    content = <p className="text-center text-white/60">Laster…</p>
  } else if (!token) {
    content = (
      <section className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
        <p className="text-white/70">Logg inn for å se profilene til medlemmene.</p>
        <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
          Logg inn
        </button>
      </section>
    )
  } else if (current?.error) {
    const { status, message } = current.error
    content = (
      <section className={`${CARD} space-y-3 p-5`}>
        <p className="text-white/70">
          {status === 401 ? 'Økten din har utløpt. Logg inn på nytt.' : status === 404 ? 'Fant ikke dette medlemmet.' : message}
        </p>
        {status === 401 ? (
          <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
            Logg inn på nytt
          </button>
        ) : status !== 404 ? (
          <button type="button" className={BUTTON_GHOST} onClick={() => setAttempt(n => n + 1)}>
            Prøv igjen
          </button>
        ) : (
          <Link to="/feed" className={BUTTON_GHOST}>
            Til feeden
          </Link>
        )}
      </section>
    )
  } else if (!profile) {
    content = <p className="text-center text-white/60">Henter profilen…</p>
  } else {
    content = (
      <>
        <CoinsCard profile={profile} />
        <RecordsCard profile={profile} />
        <Posts key={profile.member.id} token={token!} id={profile.member.id} profile={profile} />
      </>
    )
  }

  return (
    <Layout mainClassName="w-full max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6 text-center">
        <Badge>{profile?.isYou ? 'Din profil' : 'Medlem'}</Badge>
        {profile && (
          <>
            <Avatar name={profile.member.name} path={profile.member.avatar} className="h-28 w-28 text-3xl" />
            <h1 className="text-4xl md:text-5xl font-bold text-teb-orange tracking-tight break-words">{profile.member.name}</h1>
            {profile.isYou && (
              <Link to="/konto" className={BUTTON_GHOST}>
                <UserCog size={18} aria-hidden="true" />
                Rediger konto
              </Link>
            )}
          </>
        )}
        {!profile && <h1 className="text-4xl md:text-5xl font-bold text-teb-orange tracking-tight">Profil</h1>}
      </div>
      {content}
    </Layout>
  )
}
