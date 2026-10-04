import { useEffect, useRef, useState } from 'react'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import PostCard from '../components/feed/PostCard'
import PostEditor from '../components/feed/PostEditor'
import Reports from '../components/feed/Reports'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, INPUT } from '../components/feed/styles'
import { usePosts } from '../components/feed/usePosts'
import { useProfile } from '../account/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { ADMIN_GROUP } from '../auth/userManager'
import { SORTS, type Sort } from '../lib/feed'
import { cn } from '../lib/utils'

const PAGE_SIZE = 10

export default function Feed() {
  const { user, isLoading, login } = useAuth()
  const { profile } = useProfile()
  const token = user?.access_token ?? null
  const [sort, setSort] = useState<Sort>('new')
  const { posts, error, hasMore, loadingMore, loadMore, retry, add, change, remove } = usePosts(sort, PAGE_SIZE)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  // The next page is fetched as the end of the list comes near; the button is there for
  // browsers and keyboards that don't scroll to it
  useEffect(() => {
    const marker = moreRef.current
    if (!marker || !hasMore) return
    const observer = new IntersectionObserver(entries => entries[0].isIntersecting && loadMore(), { rootMargin: '600px' })
    observer.observe(marker)
    return () => observer.disconnect()
  })

  return (
    <Layout mainClassName="w-full max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6 text-center">
        <Badge>Feed</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Nyhetsfeed</h1>
        <p className="text-white/70 max-w-xl">Siste nytt fra medlemmene i TEBONSMA.</p>
      </div>

      {token ? (
        <section className={`${CARD} p-4 md:p-5`}>
          <PostEditor token={token} onSaved={add} />
        </section>
      ) : (
        !isLoading && (
          <section className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4 md:p-5`}>
            <p className="text-sm text-white/70">Logg inn for å skrive innlegg og se alt medlemmene har delt.</p>
            <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
              Logg inn
            </button>
          </section>
        )
      )}

      {token && profile?.groups.includes(ADMIN_GROUP) && <Reports token={token} onPostDeleted={remove} />}

      <div className="flex items-center justify-end gap-2">
        <label htmlFor="feed-sort" className="shrink-0 text-sm text-white/60">
          Sorter etter
        </label>
        <select
          id="feed-sort"
          className={cn(INPUT, 'w-auto cursor-pointer')}
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
        >
          {SORTS.map(option => (
            <option key={option.value} value={option.value} className="bg-neutral-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {!posts && <p className="py-8 text-center text-white/60">Laster innlegg…</p>}

      {posts?.map(post => <PostCard key={post.id} post={post} onChange={change} onDelete={remove} />)}

      {posts?.length === 0 && !error && (
        <p className="py-8 text-center text-white/60">
          {token ? 'Ingen innlegg ennå. Skriv det første!' : 'Ingen offentlige innlegg ennå.'}
        </p>
      )}

      {error && (
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-red-300">{error}</p>
          <button type="button" className={BUTTON_GHOST} onClick={retry}>
            Prøv igjen
          </button>
        </div>
      )}

      {hasMore && (
        <div ref={moreRef} className="flex justify-center">
          <button type="button" className={BUTTON_GHOST} disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Laster…' : 'Vis flere innlegg'}
          </button>
        </div>
      )}
    </Layout>
  )
}
