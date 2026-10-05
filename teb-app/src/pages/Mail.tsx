import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Folder as FolderIcon } from 'lucide-react'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT } from '../components/feed/styles'
import MailActions, { type MailActionHandlers } from '../components/mail/MailActions'
import MailList from '../components/mail/MailList'
import MailSidebar from '../components/mail/MailSidebar'
import MailToolbar from '../components/mail/MailToolbar'
import MailView from '../components/mail/MailView'
import { useFolders, useMailList, useMessage } from '../components/mail/useMail'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../lib/feed'
import {
  changeLabels,
  deleteForever,
  emptyTrash,
  moveMessages,
  restoreMessages,
  setFlags,
  type MailFilter,
  type MailMessage,
  type MailSort,
  type MailSummary,
} from '../lib/mail'

const filterFrom = (params: URLSearchParams): MailFilter => ({
  q: params.get('q') || undefined,
  label: params.get('label') || undefined,
  unread: params.get('unread') === '1' || undefined,
  flagged: params.get('flagged') === '1' || undefined,
  attachment: params.get('attachment') === '1' || undefined,
})

export default function Mail() {
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null
  const navigate = useNavigate()
  const { search } = useLocation()
  const { folder = 'inbox', id } = useParams()
  const [params, setParams] = useSearchParams()
  const filter = filterFrom(params)
  const [sort, setSort] = useState<MailSort>('new')
  const [showFolders, setShowFolders] = useState(false)
  // The mail that pictures from other sites were asked for in, so it resets for the next mail
  const [imagesFor, setImagesFor] = useState<string | null>(null)
  // The chosen mails belong to one list; another folder or search starts with none chosen
  const scope = `${folder}|${search}`
  const [chosen, setChosen] = useState<{ scope: string; ids: string[] }>({ scope, ids: [] })
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { folders, labels, error: folderError, refresh } = useFolders()
  const list = useMailList(folder, sort, filter)
  const showImages = !!id && imagesFor === id
  const checked = new Set(chosen.scope === scope ? chosen.ids : [])

  const opened = useMessage(id, showImages, (message: MailMessage) => {
    const listed = list.messages?.find(mail => mail.id === message.id)
    list.change([message.id], () => ({ seen: true }))
    // The counts only change when a mail that was unread has been read
    if (listed && !listed.seen) refresh()
  })

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const patchFilter = (patch: MailFilter) =>
    setParams(
      previous => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value === true ? '1' : String(value))
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  const toggle = (mailId: string) =>
    setChosen({ scope, ids: checked.has(mailId) ? [...checked].filter(other => other !== mailId) : [...checked, mailId] })

  const loaded = list.messages ?? []
  const selection = loaded.filter(mail => checked.has(mail.id))
  const toggleAll = () => setChosen({ scope, ids: selection.length === loaded.length ? [] : loaded.map(mail => mail.id) })

  // Runs a change on the server, and brings the list and the open mail along when it went through
  const run = async (work: () => Promise<unknown>, done: () => void) => {
    setBusy(true)
    setActionError(null)
    try {
      await work()
      done()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // The list closes up around mails that are gone, and an open mail that went too is closed
  const gone = (ids: string[]) => {
    list.remove(ids)
    setChosen({ scope, ids: [] })
    refresh()
    if (id && ids.includes(id)) navigate(`/mail/${encodeURIComponent(folder)}${search}`, { replace: true })
  }

  const handlersFor = (mails: MailSummary[]): MailActionHandlers => {
    const ids = mails.map(mail => mail.id)
    return {
      onFlags: change =>
        run(
          () => setFlags(token!, ids, change),
          () => {
            list.change(ids, () => change)
            if (id && ids.includes(id)) opened.patch(change)
            refresh()
          },
        ),
      onLabels: (add, remove) =>
        run(
          () => changeLabels(token!, ids, add, remove),
          () => {
            const next = (current: string[]) => [...current.filter(label => !add.includes(label) && !remove.includes(label)), ...add]
            list.change(ids, mail => ({ labels: next(mail.labels) }))
            if (id && ids.includes(id) && opened.message) opened.patch({ labels: next(opened.message.labels) })
          },
        ),
      onMove: target =>
        run(
          () => moveMessages(token!, ids, target),
          () => gone(ids),
        ),
      onRestore: () =>
        run(
          () => restoreMessages(token!, ids),
          () => gone(ids),
        ),
      onDeleteForever: () => {
        if (!window.confirm(ids.length === 1 ? 'Slette mailen for godt?' : `Slette ${ids.length} mails for godt?`)) return
        void run(
          () => deleteForever(token!, ids),
          () => gone(ids),
        )
      },
      onLabelCreated: refresh,
    }
  }

  if (!token) {
    return (
      <Layout mainClassName="w-full max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <div className="flex flex-col items-center gap-4 mb-6 text-center">
          <Badge>Mail</Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Mail</h1>
        </div>
        {!isLoading && (
          <section className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4 md:p-5`}>
            <p className="text-sm text-white/70">Logg inn for å lese og skrive mail fra tebonsma.no-adressen din.</p>
            <button type="button" className={BUTTON_PRIMARY} onClick={() => login()}>
              Logg inn
            </button>
          </section>
        )}
      </Layout>
    )
  }

  const allFolders = folders ?? []
  const openSummary: MailSummary | null = opened.message

  return (
    <Layout mainClassName="w-full max-w-7xl mx-auto px-4 pt-20 pb-6">
      <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
        <button type="button" className={BUTTON_GHOST} onClick={() => setShowFolders(open => !open)} aria-expanded={showFolders}>
          <FolderIcon size={16} aria-hidden="true" />
          Mapper
        </button>
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-7rem)] lg:grid-cols-[13rem_24rem_minmax(0,1fr)]">
        <aside className={`${showFolders ? 'block' : 'hidden'} lg:block lg:overflow-y-auto`}>
          <MailSidebar
            token={token}
            folders={folders}
            labels={labels}
            active={folder}
            activeLabel={filter.label}
            onChanged={refresh}
            onNavigate={() => setShowFolders(false)}
          />
          {folderError && <p className={`${ERROR_TEXT} px-3 pt-2`}>{folderError}</p>}
        </aside>

        <section className={`${CARD} ${id ? 'hidden lg:flex' : 'flex'} min-h-[50vh] flex-col overflow-hidden`}>
          <MailToolbar
            search={filter.q ?? ''}
            onSearch={q => patchFilter({ q })}
            onSearchEverywhere={filter.q && folder !== 'all' ? () => navigate(`/mail/all${search}`) : null}
            sort={sort}
            onSort={setSort}
            filter={filter}
            onFilter={patchFilter}
            allChecked={loaded.length > 0 && selection.length === loaded.length}
            someChecked={selection.length > 0}
            onToggleAll={toggleAll}
            actions={
              <MailActions
                token={token}
                mails={selection}
                folders={allFolders}
                labels={labels}
                current={folder}
                disabled={busy}
                {...handlersFor(selection)}
              />
            }
          />
          {actionError && <p className={`${ERROR_TEXT} border-b border-white/10 px-3 py-2`}>{actionError}</p>}
          {folder === 'trash' && loaded.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs text-white/50">
              <span>Mail i papirkurven kan gjenopprettes</span>
              <button
                type="button"
                className="cursor-pointer text-red-300 hover:text-red-200 disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm('Tømme papirkurven? Mailene slettes for godt.')) return
                  void run(
                    () => emptyTrash(token),
                    () => {
                      list.retry()
                      refresh()
                    },
                  )
                }}
              >
                Tøm papirkurven
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MailList
              folder={folder}
              search={search}
              messages={list.messages}
              labels={labels}
              error={list.error}
              selected={id}
              checked={checked}
              onToggle={toggle}
              onToggleStar={mail => handlersFor([mail]).onFlags({ flagged: !mail.flagged })}
              hasMore={list.hasMore}
              loadingMore={list.loadingMore}
              onLoadMore={list.loadMore}
              onRetry={list.retry}
            />
          </div>
        </section>

        <section className={`${CARD} ${id ? 'block' : 'hidden lg:block'} min-h-[50vh] overflow-y-auto`}>
          {!id && <p className="p-6 text-center text-sm text-white/50">Velg en mail for å lese den</p>}
          {id && opened.loading && <p className="p-4 text-sm text-white/50">Laster mail…</p>}
          {id && opened.error && (
            <div className="space-y-3 p-4">
              <p className={ERROR_TEXT}>{opened.error}</p>
              <Link to={`/mail/${encodeURIComponent(folder)}${search}`} className={BUTTON_GHOST}>
                Tilbake til mappen
              </Link>
            </div>
          )}
          {opened.message && openSummary && (
            <MailView
              token={token}
              message={opened.message}
              folder={folder}
              search={search}
              folders={allFolders}
              labels={labels}
              busy={busy}
              showImages={showImages}
              onShowImages={() => setImagesFor(id ?? null)}
              {...handlersFor([openSummary])}
            />
          )}
        </section>
      </div>
    </Layout>
  )
}
