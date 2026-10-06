import { useEffect, useState } from 'react'
import { errorMessage, type Post } from '../../lib/feed'
import { listMemberPosts, type PostKind } from '../../lib/memberProfile'

interface Loaded {
  key: string
  posts: Post[]
  hasMore: boolean
  error: string | null
}

// What a member has posted, a page at a time. Changing member or kind starts over.
export function useMemberPosts(token: string, id: string, kind: PostKind, pageSize: number) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const key = `${id}:${kind}:${attempt}`
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    let active = true
    listMemberPosts(token, id, kind, 0, pageSize)
      .then(page => {
        if (active) setLoaded({ key, posts: page.posts, hasMore: page.nextOffset !== null, error: null })
      })
      .catch(err => {
        if (active) setLoaded({ key, posts: [], hasMore: false, error: errorMessage(err) })
      })
    return () => {
      active = false
    }
  }, [token, id, kind, pageSize, key])

  const update = (change: (posts: Post[]) => Post[]) =>
    setLoaded(state => (state?.key === key ? { ...state, posts: change(state.posts) } : state))

  const loadMore = () => {
    if (!current?.hasMore || loadingMore) return
    setLoadingMore(true)
    listMemberPosts(token, id, kind, current.posts.length, pageSize)
      .then(page =>
        setLoaded(state =>
          state?.key === key
            ? {
                ...state,
                posts: [...state.posts, ...page.posts.filter(post => !state.posts.some(shown => shown.id === post.id))],
                hasMore: page.nextOffset !== null,
              }
            : state,
        ),
      )
      .catch(err => setLoaded(state => (state?.key === key ? { ...state, hasMore: false, error: errorMessage(err) } : state)))
      .finally(() => setLoadingMore(false))
  }

  return {
    posts: current?.posts ?? null,
    error: current?.error ?? null,
    hasMore: current?.hasMore ?? false,
    loadingMore,
    loadMore,
    retry: () => setAttempt(n => n + 1),
    change: (post: Post) => update(posts => posts.map(shown => (shown.id === post.id ? post : shown))),
    remove: (id: string) => update(posts => posts.filter(shown => shown.id !== id)),
  }
}
