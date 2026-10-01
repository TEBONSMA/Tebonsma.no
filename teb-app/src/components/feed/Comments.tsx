import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Send } from 'lucide-react'
import Avatar from '../Avatar'
import { cn } from '../../lib/utils'
import { useAuth } from '../../auth/AuthContext'
import {
  addComment,
  deleteComment,
  errorMessage,
  formatDate,
  getCommentLikers,
  likeComment,
  listComments,
  MAX_COMMENT_ATTACHMENTS,
  MAX_COMMENT_LENGTH,
  timeAgo,
  type Comment,
  type Visibility,
} from '../../lib/feed'
import AttachmentChips from './AttachmentChips'
import Attachments from './Attachments'
import LikeButton from './LikeButton'
import { ACTION, BUTTON_PRIMARY, ERROR_TEXT, INPUT } from './styles'
import { useAttachments } from './useAttachments'

const LINK = 'text-xs font-medium text-white/50 cursor-pointer hover:text-white disabled:opacity-50'

function CommentForm({ placeholder, token, autoFocus = false, onSubmit }: {
  placeholder: string
  token: string
  autoFocus?: boolean
  onSubmit: (body: string, attachmentIds: string[]) => Promise<void>
}) {
  const pictureInput = useRef<HTMLInputElement>(null)
  const pictures = useAttachments(token, MAX_COMMENT_ATTACHMENTS)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(body, pictures.attachments.map(a => a.id))
      setBody('')
      pictures.clear()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <AttachmentChips attachments={pictures.attachments} uploading={pictures.uploading} token={token} onRemove={pictures.remove} />
      <div className="flex items-end gap-2">
        <button type="button" className={cn(ACTION, 'h-10 px-2')} aria-label="Legg ved bilde" onClick={() => pictureInput.current?.click()}>
          <ImagePlus size={18} aria-hidden="true" />
        </button>
        <input
          ref={pictureInput}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => {
            pictures.upload(e.target.files)
            // So choosing the same picture again counts as a new choice
            e.target.value = ''
          }}
        />
        <textarea
          className={`${INPUT} min-h-10 resize-y`}
          rows={1}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => {
            // Enter sends; Shift+Enter makes a new line
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          className={cn(BUTTON_PRIMARY, 'px-3')}
          disabled={busy || pictures.uploading > 0 || (!body.trim() && pictures.attachments.length === 0)}
          aria-label="Send"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
      {(error ?? pictures.error) && <p className={ERROR_TEXT}>{error ?? pictures.error}</p>}
    </form>
  )
}

interface CommentItemProps {
  comment: Comment
  visibility: Visibility
  token: string | null
  isAdmin: boolean
  onReply: () => void
  onChange: (comment: Comment) => void
  onDelete: () => Promise<void>
}

function CommentItem({ comment, visibility, token, isAdmin, onReply, onChange, onDelete }: CommentItemProps) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (comment.deleted || !comment.author) {
    return <p className="py-1 text-sm italic text-white/40">Kommentaren er slettet</p>
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDelete()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="flex gap-2.5">
      <Avatar name={comment.author.name} path={comment.author.avatar} className="mt-0.5 h-7 w-7 text-[11px]" />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-lg bg-white/5 px-3 py-2">
          <p className="text-sm font-semibold text-white">{comment.author.name}</p>
          {comment.body && <p className="whitespace-pre-wrap break-words text-sm text-white/85">{comment.body}</p>}
        </div>
        {comment.attachments.length > 0 && (
          <div className="mt-1.5 max-w-sm">
            <Attachments attachments={comment.attachments} visibility={visibility} token={token} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 pl-1">
          <LikeButton
            small
            liked={comment.liked}
            count={comment.likeCount}
            canLike={!!token}
            save={liked => likeComment(token!, comment.id, liked)}
            loadLikers={() => getCommentLikers(token!, comment.id)}
            onChange={like => onChange({ ...comment, ...like })}
          />
          {token && (
            <button type="button" className={LINK} onClick={onReply}>
              Svar
            </button>
          )}
          {(comment.mine || isAdmin) &&
            (confirming ? (
              <>
                <button type="button" className={cn(LINK, 'text-red-300 hover:text-red-200')} disabled={busy} onClick={remove}>
                  Bekreft sletting
                </button>
                <button type="button" className={LINK} disabled={busy} onClick={() => setConfirming(false)}>
                  Avbryt
                </button>
              </>
            ) : (
              <button type="button" className={LINK} onClick={() => setConfirming(true)}>
                Slett
              </button>
            ))}
          <time className="text-xs text-white/40" dateTime={comment.createdAt} title={formatDate(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
          </time>
        </div>
        {error && <p className={ERROR_TEXT}>{error}</p>}
      </div>
    </div>
  )
}

interface CommentsProps {
  postId: string
  // Of the post, which the pictures on its comments follow
  visibility: Visibility
  token: string | null
  isAdmin: boolean
  // Told how many comments there are after one is added or deleted
  onCount: (count: number) => void
}

const Comments = ({ postId, visibility, token, isAdmin, onCount }: CommentsProps) => {
  const { login } = useAuth()
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listComments(token, postId)
      .then(loaded => {
        if (active) setComments(loaded)
      })
      .catch(err => {
        if (active) setError(errorMessage(err))
      })
    return () => {
      active = false
    }
  }, [postId, token])

  if (error) return <p className={ERROR_TEXT}>{error}</p>
  if (!comments) return <p className="text-sm text-white/50">Laster kommentarer…</p>

  const show = (next: Comment[]) => {
    setComments(next)
    onCount(next.filter(comment => !comment.deleted).length)
  }

  const add = async (body: string, attachmentIds: string[], parentId: string | null) => {
    if (!token) return
    const added = await addComment(token, postId, body, parentId, attachmentIds)
    show([...comments, added])
    setReplyingTo(null)
  }

  const remove = async (comment: Comment) => {
    if (!token) return
    await deleteComment(token, comment.id)
    // The server keeps a deleted comment as a placeholder while it has replies, and drops
    // the placeholder with its last reply; fetching again shows whichever it did
    show(await listComments(token, postId))
  }

  const change = (changed: Comment) => setComments(comments.map(comment => (comment.id === changed.id ? changed : comment)))

  const item = (comment: Comment, threadId: string) => (
    <CommentItem
      key={comment.id}
      comment={comment}
      visibility={visibility}
      token={token}
      isAdmin={isAdmin}
      onReply={() => setReplyingTo(replyingTo === threadId ? null : threadId)}
      onChange={change}
      onDelete={() => remove(comment)}
    />
  )

  return (
    <div className="space-y-4">
      {comments
        .filter(comment => !comment.parentId)
        .map(thread => {
          const replies = comments.filter(comment => comment.parentId === thread.id)
          // A deleted comment can't be answered, but its thread can, through one of the replies
          const answerTo = thread.deleted ? replies[0]?.id : thread.id
          return (
            <div key={thread.id} className="space-y-3">
              {item(thread, thread.id)}
              <div className="ml-9 space-y-3 empty:hidden">
                {replies.map(reply => item(reply, thread.id))}
                {replyingTo === thread.id && answerTo && token && (
                  <CommentForm
                    autoFocus
                    token={token}
                    placeholder="Skriv et svar…"
                    onSubmit={(body, attachmentIds) => add(body, attachmentIds, answerTo)}
                  />
                )}
              </div>
            </div>
          )
        })}

      {token ? (
        <CommentForm token={token} placeholder="Skriv en kommentar…" onSubmit={(body, attachmentIds) => add(body, attachmentIds, null)} />
      ) : (
        <p className="text-sm text-white/50">
          <button type="button" className="font-medium text-teb-orange cursor-pointer hover:underline" onClick={() => login()}>
            Logg inn
          </button>{' '}
          for å like og kommentere.
        </p>
      )}
    </div>
  )
}

export default Comments
