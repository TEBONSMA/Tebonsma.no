import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { errorMessage, listPosts, type Post, type Sort } from '../../lib/feed'

interface Loaded {
  key: string
  posts: Post[]
  hasMore: boolean
  error: string | null
}

// The feed in the chosen order, a page at a time. Members get every post, visitors the
// public ones, so the list is fetched again when someone logs in or out.
export function usePosts(sort: Sort, pageSize: number) {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // What the list on screen was fetched for. A renewed login keeps the key, so the list
  // stays up while it is fetched again.
  const key = `${token ? 'member' : 'visitor'}:${sort}:${attempt}`
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (isLoading) return
    let active = true
    listPosts(token, sort, 0, pageSize)
      .then(page => {
        if (active) setLoaded({ key, posts: page.posts, hasMore: page.nextOffset !== null, error: null })
      })
      .catch(err => {
        if (active) setLoaded({ key, posts: [], hasMore: false, error: errorMessage(err) })
      })
    return () => {
      active = false
    }
  }, [isLoading, token, sort, pageSize, key])

  const update = (change: (posts: Post[]) => Post[]) =>
    setLoaded(state => (state?.key === key ? { ...state, posts: change(state.posts) } : state))

  const loadMore = () => {
    if (!current?.hasMore || loadingMore) return
    setLoadingMore(true)
    // Posts written or deleted here are already in the list, so its length is how far the
    // server has been read. A post someone else wrote meanwhile can come twice; it is skipped.
    listPosts(token, sort, current.posts.length, pageSize)
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
    // A new post goes below the pinned ones, where the server would put it
    add: (post: Post) =>
      update(posts => {
        const pinned = posts.filter(shown => shown.pinned)
        return [...pinned, post, ...posts.filter(shown => !shown.pinned)]
      }),
    change: (post: Post) => update(posts => posts.map(shown => (shown.id === post.id ? post : shown))),
    remove: (id: string) => update(posts => posts.filter(shown => shown.id !== id)),
  }
}
