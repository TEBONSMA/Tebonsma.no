import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import PostCard from '../components/feed/PostCard'
import { BUTTON_PRIMARY, CARD } from '../components/feed/styles'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { errorMessage, getPost, type Post } from '../lib/feed'

type Loaded = { id: string } & ({ post: Post } | { error: string; needsLogin: boolean })

// A single post with its comments: where shared links and notifications lead
export default function FeedPost() {
  const { id = '' } = useParams()
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    if (isLoading) return
    let active = true
    getPost(token, id)
      .then(post => {
        if (active) setLoaded({ id, post })
      })
      .catch(err => {
        if (active) setLoaded({ id, error: errorMessage(err), needsLogin: err instanceof ApiError && err.status === 401 })
      })
    return () => {
      active = false
    }
  }, [id, token, isLoading])

  const current = loaded?.id === id ? loaded : null

  return (
    <Layout mainClassName="w-full max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
        <ArrowLeft size={16} aria-hidden="true" />
        Til feeden
      </Link>

      {!current && <p className="py-8 text-center text-white/60">Laster innlegg…</p>}

      {current && 'post' in current && (
        <PostCard
          post={current.post}
          commentsOpen
          onChange={post => setLoaded({ id, post })}
          onDelete={() => navigate('/feed', { replace: true })}
        />
      )}

      {current && 'error' in current && (
        <section className={`${CARD} space-y-4 p-6`}>
          <p className="text-white/70">{current.error}</p>
          {current.needsLogin && (
            <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
              Logg inn
            </button>
          )}
        </section>
      )}
    </Layout>
  )
}
