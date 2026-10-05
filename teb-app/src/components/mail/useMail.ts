import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { errorMessage } from '../../lib/feed'
import {
  getFolders,
  getConversation,
  getMessage,
  listMessages,
  type Folder,
  type Label,
  type MailFilter,
  type MailMessage,
  type MailSort,
  type MailSummary,
} from '../../lib/mail'

interface LoadedFolders {
  key: string
  folders: Folder[]
  labels: Label[]
  error: string | null
}

// The folders with their number of unread mails. Fetched again whenever something changes
// the counts.
export function useFolders() {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<LoadedFolders | null>(null)
  const key = `${token ? 'member' : 'visitor'}:${attempt}`
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (isLoading || !token) return
    let active = true
    getFolders(token)
      .then(({ folders, labels }) => active && setLoaded({ key, folders, labels, error: null }))
      .catch(err => active && setLoaded({ key, folders: [], labels: [], error: errorMessage(err) }))
    return () => {
      active = false
    }
  }, [isLoading, token, key])

  return {
    folders: current?.folders ?? null,
    labels: current?.labels ?? [],
    error: current?.error ?? null,
    refresh: () => setAttempt(n => n + 1),
  }
}

interface LoadedList {
  key: string
  messages: MailSummary[]
  hasMore: boolean
  error: string | null
}

// The mails in a folder in the chosen order, a page at a time
export function useMailList(folder: string, sort: MailSort, filter: MailFilter) {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<LoadedList | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // What the list on screen was fetched for. A renewed login keeps the key, so the list
  // stays up while it is fetched again.
  const key = `${token ? 'member' : 'visitor'}:${folder}:${sort}:${JSON.stringify(filter)}:${attempt}`
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (isLoading || !token) return
    let active = true
    listMessages(token, { folder, sort, filter, offset: 0 })
      .then(page => active && setLoaded({ key, messages: page.messages, hasMore: page.nextOffset !== null, error: null }))
      .catch(err => active && setLoaded({ key, messages: [], hasMore: false, error: errorMessage(err) }))
    return () => {
      active = false
    }
      // The filter is part of key, which changes whenever it does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, token, folder, sort, key])

  const update = (change: (messages: MailSummary[]) => MailSummary[]) =>
    setLoaded(state => (state?.key === key ? { ...state, messages: change(state.messages) } : state))

  const loadMore = () => {
    if (!current?.hasMore || loadingMore || !token) return
    setLoadingMore(true)
    // The list's length is how far the server has been read, since mails moved or deleted
    // here have been taken out of it already. A mail that arrived meanwhile can come twice;
    // it is skipped.
    listMessages(token, { folder, sort, filter, offset: current.messages.length })
      .then(page =>
        setLoaded(state =>
          state?.key === key
            ? {
                ...state,
                messages: [...state.messages, ...page.messages.filter(mail => !state.messages.some(shown => shown.id === mail.id))],
                hasMore: page.nextOffset !== null,
              }
            : state,
        ),
      )
      .catch(err => setLoaded(state => (state?.key === key ? { ...state, hasMore: false, error: errorMessage(err) } : state)))
      .finally(() => setLoadingMore(false))
  }

  return {
    messages: current?.messages ?? null,
    error: current?.error ?? null,
    hasMore: current?.hasMore ?? false,
    loadingMore,
    loadMore,
    retry: () => setAttempt(n => n + 1),
    change: (ids: string[], changes: (mail: MailSummary) => Partial<MailSummary>) =>
      update(messages => messages.map(mail => (mail.ids.some(id => ids.includes(id)) ? { ...mail, ...changes(mail) } : mail))),
    // A row goes when every mail it stands for has gone
    remove: (ids: string[]) => update(messages => messages.filter(mail => !mail.ids.every(id => ids.includes(id)))),
  }
}

interface LoadedConversation {
  key: string
  messages: MailSummary[]
  error: string | null
}

// The mails of the conversation the opened mail is part of. Opening it reads them, which the
// caller is told about.
export function useConversation(id: string | undefined, onOpened: (messages: MailSummary[]) => void) {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const [loaded, setLoaded] = useState<LoadedConversation | null>(null)
  const key = `${id}`
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (isLoading || !token || !id) return
    let active = true
    getConversation(token, id)
      .then(({ messages }) => {
        if (!active) return
        setLoaded({ key, messages, error: null })
        onOpened(messages)
      })
      .catch(err => active && setLoaded({ key, messages: [], error: errorMessage(err) }))
    return () => {
      active = false
    }
    // onOpened only tells the list about the mails; a new function each render isn't a reason to read them again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, token, id, key])

  return {
    messages: current && !current.error ? current.messages : null,
    error: current?.error ?? null,
    loading: !!id && !current,
    // The mails were changed from here (read, starred, labelled), so what is shown follows
    patch: (ids: string[], changes: (mail: MailSummary) => Partial<MailSummary>) =>
      setLoaded(state =>
        state?.key === key
          ? { ...state, messages: state.messages.map(mail => (ids.includes(mail.id) ? { ...mail, ...changes(mail) } : mail)) }
          : state,
      ),
  }
}

interface LoadedBody {
  key: string
  message: MailMessage | null
  error: string | null
}

// One mail's content, fetched once its card is opened
export function useMessageBody(id: string, open: boolean, images: boolean) {
  const { user, isLoading } = useAuth()
  const token = user?.access_token ?? null
  const [loaded, setLoaded] = useState<LoadedBody | null>(null)
  const key = `${id}:${images}`
  const current = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (isLoading || !token || !open) return
    let active = true
    getMessage(token, id, images)
      .then(message => active && setLoaded({ key, message, error: null }))
      .catch(err => active && setLoaded({ key, message: null, error: errorMessage(err) }))
    return () => {
      active = false
    }
  }, [isLoading, token, open, id, images, key])

  // A mail that has been loaded stays on screen while it is fetched again with pictures
  const shown = current ?? loaded
  return { message: shown?.message ?? null, error: current?.error ?? null, loading: open && !current && !shown?.message }
}
