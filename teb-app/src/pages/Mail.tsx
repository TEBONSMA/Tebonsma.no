import { lazy, Suspense, useEffect, useState } from 'react'
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
import SharedView from '../components/mail/SharedView'
import ShareDialog from '../components/mail/ShareDialog'
import UndoToast from '../components/mail/UndoToast'
import { useNotifications } from '../components/feed/NotificationsContext'
import { useConversation, useFolders, useMailList, useMembers, useShared } from '../components/mail/useMail'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../lib/feed'
import {
  cancelScheduled,
  cancelSend,
  changeLabels,
  deleteSharedMany,
  deleteForever,
  EMPTY_FIELDS,
  emptyTrash,
  getComposeSeed,
  getMailSettings,
  conversationSummary,
  isVirtualFolder,
  moveMessages,
  rescheduleMail,
  restoreMessages,
  setFlags,
  snoozeMessages,
  type ComposeMode,
  type ComposeSeed,
  type MailFilter,
  type MailSort,
  type MailSummary,
  type Sent,
} from '../lib/mail'

const filterFrom = (params: URLSearchParams): MailFilter => ({
  q: params.get('q') || undefined,
  label: params.get('label') || undefined,
  unread: params.get('unread') === '1' || undefined,
  flagged: params.get('flagged') === '1' || undefined,
  attachment: params.get('attachment') === '1' || undefined,
})

// What the toast at the bottom says, and what taking sending back would reopen
interface Note {
  key: number
  message: string
  undo: { outboxId: string; until: string; seed: ComposeSeed } | null
}

const scheduledAt = new Intl.DateTimeFormat('nb', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

// The editor is large and only needed when someone starts writing
const Composer = lazy(() => import('../components/mail/Composer'))

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
  // The chosen mails belong to one list; another folder or search starts with none chosen
  const scope = `${folder}|${search}`
  const [chosen, setChosen] = useState<{ scope: string; ids: string[] }>({ scope, ids: [] })
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // The writing window, and the note that a mail was sent with the chance to take it back
  const [composer, setComposer] = useState<{ seed: ComposeSeed; key: number } | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [undoing, setUndoing] = useState(false)
  const [undoError, setUndoError] = useState<string | null>(null)
  // The mail being shared, with a member or to the feed
  const [sharing, setSharing] = useState<MailSummary | null>(null)
  const members = useMembers(composer !== null || sharing !== null)

  const { folders, labels, shared, error: folderError, refresh: refreshFolders } = useFolders()
  const { refresh: refreshNotifications } = useNotifications()
  // What changes the folders' counts changes the number next to Mail in the menu and the bell too
  const refresh = () => {
    refreshFolders()
    refreshNotifications()
  }
  const list = useMailList(folder, sort, filter)
  const checked = new Set(chosen.scope === scope ? chosen.ids : [])

  // Opening a conversation reads it, so the list and the counts follow when anything was unread
  // Mails other members shared are kept by the site, so they are read another way
  const isShared = folder === 'shared'
  const opened = useConversation(isShared ? undefined : id, messages => {
    const ids = messages.map(mail => mail.id)
    if (messages.some(mail => !mail.seen)) {
      list.change(ids, () => ({ seen: true, unreadCount: 0 }))
      refresh()
    }
  })

  const openedShared = useShared(isShared ? id : undefined, () => {
    list.change([id!], () => ({ seen: true, unreadCount: 0 }))
    refresh()
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
  const run = async <T,>(work: () => Promise<T>, done: (result: T) => void) => {
    setBusy(true)
    setActionError(null)
    try {
      done(await work())
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
    if (opened.messages?.some(mail => ids.includes(mail.id)) || (isShared && id && ids.includes(id))) navigate(`/mail/${encodeURIComponent(folder)}${search}`, { replace: true })
  }

  const handlersFor = (mails: MailSummary[]): MailActionHandlers => {
    // A row can stand for a whole conversation, and what is done to it is done to every mail in it
    const ids = mails.flatMap(mail => mail.ids)
    // What a flag change does to a row's own fields
    const flagged = (change: { seen?: boolean; flagged?: boolean }) => (mail: MailSummary) => ({
      ...(change.flagged !== undefined && { flagged: change.flagged }),
      ...(change.seen !== undefined && { seen: change.seen, unreadCount: change.seen ? 0 : mail.count }),
    })
    return {
      onFlags: change =>
        run(
          () => setFlags(token!, ids, change),
          () => {
            list.change(ids, flagged(change))
            opened.patch(ids, flagged(change))
            refresh()
          },
        ),
      onLabels: (add, remove) =>
        run(
          () => changeLabels(token!, ids, add, remove),
          () => {
            const next = (mail: MailSummary) => ({
              labels: [...mail.labels.filter(label => !add.includes(label) && !remove.includes(label)), ...add],
            })
            list.change(ids, next)
            opened.patch(ids, next)
          },
        ),
      onMove: target =>
        run(
          () => moveMessages(token!, ids, target),
          () => gone(ids),
        ),
      onSnooze: until =>
        run(
          () => snoozeMessages(token!, ids, until),
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

  // The signature goes at the end of what is written, above anything quoted
  const withSignature = async (seed: ComposeSeed): Promise<ComposeSeed> => {
    const { signature } = await getMailSettings(token!)
    if (!signature) return seed
    const html = seed.fields.html.startsWith('<p></p>') ? seed.fields.html.slice('<p></p>'.length) : seed.fields.html
    return { ...seed, fields: { ...seed.fields, html: `<p></p>${signature}${html}` } }
  }

  const openComposer = (seed: ComposeSeed) => setComposer({ seed, key: Date.now() })

  const startNew = () =>
    run(
      () => withSignature({ fields: EMPTY_FIELDS, attachments: [] }),
      seed => openComposer(seed),
    )

  const startFrom = (id: string, mode: ComposeMode) =>
    run(
      async () => {
        const seed = await getComposeSeed(token!, id, mode)
        return mode === 'draft' ? seed : withSignature(seed)
      },
      seed => openComposer(seed),
    )

  const afterSend = (sent: Sent, seed: ComposeSeed) => {
    setComposer(null)
    setUndoError(null)
    setNote({
      key: Date.now(),
      message: 'Mail sendt',
      undo: sent.outboxId ? { outboxId: sent.outboxId, until: sent.sendAt, seed } : null,
    })
    // The mail shows up in Sent and the draft leaves Drafts once the waiting time is over
    const wait = Math.max(0, new Date(sent.sendAt).getTime() - Date.now()) + 800
    setTimeout(() => {
      refresh()
      if (folder === 'sent' || folder === 'drafts') list.retry()
    }, wait)
  }

  const afterSchedule = (sendAt: string) => {
    setComposer(null)
    setUndoError(null)
    setNote({ key: Date.now(), message: `Planlagt til ${scheduledAt.format(new Date(sendAt))}`, undo: null })
    refresh()
    if (folder === 'scheduled' || folder === 'drafts') list.retry()
  }

  const undo = async () => {
    if (!note?.undo) return
    setUndoing(true)
    try {
      const { draftId } = await cancelSend(token!, note.undo.outboxId)
      openComposer({ ...note.undo.seed, fields: { ...note.undo.seed.fields, draftId } })
      setNote(null)
    } catch (err) {
      setUndoError(errorMessage(err))
    } finally {
      setUndoing(false)
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
  // What is done to an open conversation is done to its mails in the folder it was opened from.
  // The replies in Sent stay there when the conversation is archived from the inbox.
  const inFolder = opened.messages?.filter(mail => isVirtualFolder(folder) || mail.folder === folder) ?? []
  const actedOn = inFolder.length > 0 ? inFolder : (opened.messages ?? [])

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
            shared={shared}
            active={folder}
            activeLabel={filter.label}
            onChanged={refresh}
            onNavigate={() => setShowFolders(false)}
            onCompose={startNew}
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
            selectable={!isShared}
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
              selectable={!isShared}
              onOpenDraft={folder === 'drafts' ? mail => void startFrom(mail.id, 'draft') : null}
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
          {isShared && id && openedShared.loading && <p className="p-4 text-sm text-white/50">Laster mail…</p>}
          {isShared && id && openedShared.error && (
            <div className="space-y-3 p-4">
              <p className={ERROR_TEXT}>{openedShared.error}</p>
              <Link to={`/mail/shared${search}`} className={BUTTON_GHOST}>
                Tilbake til mappen
              </Link>
            </div>
          )}
          {openedShared.mail && id && (
            <SharedView
              token={token}
              mail={openedShared.mail}
              search={search}
              busy={busy}
              onDelete={() =>
                run(
                  () => deleteSharedMany(token, [id]),
                  () => gone([id]),
                )
              }
            />
          )}
          {!isShared && opened.messages && opened.messages.length > 0 && (
            <MailView
              token={token}
              messages={opened.messages}
              folder={folder}
              search={search}
              folders={allFolders}
              labels={labels}
              busy={busy}
              {...handlersFor([conversationSummary(actedOn)])}
              actedOn={actedOn}
              onCompose={mode => void startFrom(opened.messages![opened.messages!.length - 1].id, mode)}
              onShare={setSharing}
              scheduled={
                folder === 'scheduled' && id
                  ? {
                      sendAt: list.messages?.find(mail => mail.id === id)?.date ?? null,
                      onReschedule: when =>
                        run(
                          () => rescheduleMail(token, id, when.toISOString()),
                          () => list.retry(),
                        ),
                      onEdit: () =>
                        run(
                          async () => {
                            const { draftId } = await cancelScheduled(token, id)
                            return getComposeSeed(token, draftId, 'draft')
                          },
                          seed => {
                            openComposer(seed)
                            navigate('/mail/scheduled', { replace: true })
                            list.retry()
                            refresh()
                          },
                        ),
                    }
                  : null
              }
            />
          )}
        </section>
      </div>

      {composer && (
        <Suspense fallback={null}>
          <Composer
            key={composer.key}
            token={token}
            seed={composer.seed}
            members={members}
            onClose={() => {
              setComposer(null)
              refresh()
              if (folder === 'drafts') list.retry()
            }}
            onSent={afterSend}
            onScheduled={afterSchedule}
          />
        </Suspense>
      )}
      {sharing && (
        <ShareDialog
          token={token}
          mail={sharing}
          members={members}
          onClose={() => setSharing(null)}
          onShared={message => {
            setSharing(null)
            setUndoError(null)
            setNote({ key: Date.now(), message, undo: null })
          }}
        />
      )}
      {note && (
        <UndoToast
          key={note.key}
          message={note.message}
          until={note.undo?.until ?? null}
          onUndo={undo}
          onDone={() => setNote(null)}
          busy={undoing}
          error={undoError}
        />
      )}
    </Layout>
  )
}
