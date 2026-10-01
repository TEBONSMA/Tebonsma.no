import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Ellipsis, Flag, Globe, Lock, Megaphone, MessageCircle, Pencil, Pin, PinOff, Share2, Trash2 } from 'lucide-react'
import Avatar from '../Avatar'
import { cn } from '../../lib/utils'
import { useProfile } from '../../account/ProfileContext'
import { useAuth } from '../../auth/AuthContext'
import { ADMIN_GROUP } from '../../auth/userManager'
import { MAX_ANNOUNCEMENT_LENGTH, sendAnnouncement } from '../../lib/events'
import {
  deletePost,
  errorMessage,
  formatDate,
  getPostLikers,
  likePost,
  pinPost,
  postLink,
  reportPost,
  timeAgo,
  type Post,
} from '../../lib/feed'
import EventHeader from '../events/EventHeader'
import Attachments from './Attachments'
import Comments from './Comments'
import LikeButton from './LikeButton'
import PollView from './PollView'
import PostEditor from './PostEditor'
import { ACTION, BUTTON_DANGER, BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT, INPUT, MENU, MENU_ITEM } from './styles'
import { useDismiss } from './useDismiss'

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g

// Posts are plain text; only web addresses become links
const withLinks = (text: string): ReactNode[] =>
  text.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-teb-orange hover:underline">
        {part}
      </a>
    ) : (
      part
    ),
  )

type Panel = 'edit' | 'delete' | 'report' | 'announce' | null

interface PostCardProps {
  post: Post
  // Show the comments from the start, as on the post's own page
  commentsOpen?: boolean
  onChange: (post: Post) => void
  onDelete: (id: string) => void
}

const PostCard = ({ post, commentsOpen = false, onChange, onDelete }: PostCardProps) => {
  const { user } = useAuth()
  const { profile } = useProfile()
  const token = user?.access_token ?? null
  const isAdmin = !!profile?.groups.includes(ADMIN_GROUP)

  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [showComments, setShowComments] = useState(commentsOpen)
  const [reason, setReason] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [announced, setAnnounced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shared, setShared] = useState(false)

  useDismiss(menuRef, menuOpen, () => setMenuOpen(false))

  const openPanel = (next: Panel) => {
    setMenuOpen(false)
    setError(null)
    setAnnounced(false)
    setPanel(next)
  }

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const togglePin = () => {
    setMenuOpen(false)
    if (token) run(async () => onChange(await pinPost(token, post.id, !post.pinned)))
  }

  const remove = () => {
    if (token)
      run(async () => {
        await deletePost(token, post.id)
        onDelete(post.id)
      })
  }

  const report = (e: FormEvent) => {
    e.preventDefault()
    if (token)
      run(async () => {
        await reportPost(token, post.id, reason)
        onChange({ ...post, reported: true })
        setPanel(null)
        setReason('')
      })
  }

  const announce = (e: FormEvent) => {
    e.preventDefault()
    if (token)
      run(async () => {
        await sendAnnouncement(token, post.id, announcement)
        setPanel(null)
        setAnnouncement('')
        setAnnounced(true)
      })
  }

  const share = async () => {
    const url = postLink(post.id)
    try {
      // The phone's own share sheet where there is one, otherwise the link is copied
      if (navigator.share) await navigator.share({ title: post.event?.title ?? `Innlegg fra ${post.author.name}`, url })
      else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      }
    } catch {
      // Closing the share sheet without sharing is not an error
    }
  }

  const VisibilityIcon = post.visibility === 'public' ? Globe : Lock
  const visibilityLabel = post.visibility === 'public' ? 'Synlig for alle' : 'Kun for medlemmer'
  const canDelete = post.mine || isAdmin
  const canReport = !!token && !post.mine
  const hasMenu = !!token && (post.mine || isAdmin || canReport)

  return (
    <article className={cn(CARD, post.pinned && 'border-teb-orange/40')}>
      <div className="space-y-4 p-4 md:p-5">
        {post.pinned && (
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-teb-orange">
            <Pin size={14} aria-hidden="true" />
            Festet innlegg
          </p>
        )}

        <header className="flex items-start gap-3">
          <Avatar name={post.author.name} path={post.author.avatar} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{post.author.name}</p>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-white/50">
              <Link to={`/feed/${post.id}`} className="hover:underline" title={formatDate(post.createdAt)}>
                <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
              </Link>
              {post.editedAt && <span title={formatDate(post.editedAt)}>· redigert</span>}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1" title={visibilityLabel}>
                <VisibilityIcon size={12} aria-hidden="true" />
                {visibilityLabel}
              </span>
            </p>
          </div>

          {hasMenu && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className={cn(ACTION, 'px-1.5')}
                aria-label="Flere valg"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(open => !open)}
              >
                <Ellipsis size={20} aria-hidden="true" />
              </button>
              {menuOpen && (
                <div role="menu" className={`${MENU} right-0 top-[calc(100%+4px)] w-52`}>
                  {post.mine && (
                    <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => openPanel('edit')}>
                      <Pencil size={16} aria-hidden="true" />
                      Rediger
                    </button>
                  )}
                  {post.mine && post.event && (
                    <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => openPanel('announce')}>
                      <Megaphone size={16} aria-hidden="true" />
                      Send kunngjøring
                    </button>
                  )}
                  {isAdmin && (
                    <button type="button" role="menuitem" className={MENU_ITEM} onClick={togglePin}>
                      {post.pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
                      {post.pinned ? 'Løsne innlegget' : 'Fest øverst'}
                    </button>
                  )}
                  {canReport && (
                    <button
                      type="button"
                      role="menuitem"
                      className={MENU_ITEM}
                      disabled={post.reported}
                      onClick={() => openPanel('report')}
                    >
                      <Flag size={16} aria-hidden="true" />
                      {post.reported ? 'Rapportert' : 'Rapporter'}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      className={cn(MENU_ITEM, 'text-red-300 hover:text-red-200')}
                      onClick={() => openPanel('delete')}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Slett
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </header>

        {panel === 'edit' && token ? (
          <PostEditor
            token={token}
            post={post}
            onCancel={() => setPanel(null)}
            onSaved={saved => {
              onChange(saved)
              setPanel(null)
            }}
          />
        ) : (
          <>
            {post.event && (
              <EventHeader postId={post.id} event={post.event} token={token} onChange={event => onChange({ ...post, event })} />
            )}
            {post.body && (
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white/90">{withLinks(post.body)}</p>
            )}
            {post.poll && (
              <PollView postId={post.id} poll={post.poll} token={token} onChange={poll => onChange({ ...post, poll })} />
            )}
            {post.attachments.length > 0 && (
              <Attachments attachments={post.attachments} visibility={post.visibility} token={token} />
            )}
          </>
        )}

        {panel === 'delete' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-400/20 bg-red-400/5 p-3">
            <p className="text-sm text-white/80">
              {post.event ? 'Slette arrangementet? Påmeldinger, kommentarer og bilder forsvinner også.' : 'Slette innlegget? Kommentarer og vedlegg forsvinner også.'}
            </p>
            <div className="flex gap-2">
              <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => setPanel(null)}>
                Avbryt
              </button>
              <button type="button" className={BUTTON_DANGER} disabled={busy} onClick={remove}>
                Slett
              </button>
            </div>
          </div>
        )}

        {panel === 'report' && (
          <form onSubmit={report} className="space-y-2 rounded-md border border-white/10 p-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-white/80">Hvorfor rapporterer du innlegget?</span>
              <textarea
                className={`${INPUT} min-h-16 resize-y`}
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={500}
                placeholder="Valgfritt. Administratorene ser hvem som rapporterte."
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => setPanel(null)}>
                Avbryt
              </button>
              <button type="submit" className={BUTTON_PRIMARY} disabled={busy}>
                Send rapport
              </button>
            </div>
          </form>
        )}

        {panel === 'announce' && (
          <form onSubmit={announce} className="space-y-2 rounded-md border border-white/10 p-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-white/80">Kunngjøring til alle medlemmer</span>
              <textarea
                className={`${INPUT} min-h-16 resize-y`}
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                maxLength={MAX_ANNOUNCEMENT_LENGTH}
                placeholder="Alle medlemmer får et varsel med denne teksten."
                autoFocus
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => setPanel(null)}>
                Avbryt
              </button>
              <button type="submit" className={BUTTON_PRIMARY} disabled={busy || !announcement.trim()}>
                Send til alle
              </button>
            </div>
          </form>
        )}

        {announced && <p className="text-sm text-white/60">Kunngjøringen er sendt til alle medlemmer.</p>}
        {error && <p className={ERROR_TEXT}>{error}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-white/10 px-2 py-1 md:px-3">
        <LikeButton
          liked={post.liked}
          count={post.likeCount}
          canLike={!!token}
          save={liked => likePost(token!, post.id, liked)}
          loadLikers={() => getPostLikers(token!, post.id)}
          onChange={like => onChange({ ...post, ...like })}
        />
        <button type="button" className={ACTION} aria-expanded={showComments} onClick={() => setShowComments(open => !open)}>
          <MessageCircle size={18} aria-hidden="true" />
          {post.commentCount > 0 ? post.commentCount : 'Kommenter'}
        </button>
        <button type="button" className={`${ACTION} ml-auto`} onClick={share}>
          {shared ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
          {shared ? 'Lenke kopiert' : 'Del'}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-white/10 p-4 md:p-5">
          <Comments
            postId={post.id}
            visibility={post.visibility}
            token={token}
            isAdmin={isAdmin}
            onCount={commentCount => onChange({ ...post, commentCount })}
          />
        </div>
      )}
    </article>
  )
}

export default PostCard
