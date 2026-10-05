import { useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import Avatar from '../Avatar'
import MemberLink from '../MemberLink'
import { cn } from '../../lib/utils'
import { errorMessage, type FeedMember, type Like } from '../../lib/feed'
import { ACTION, ERROR_TEXT, MENU } from './styles'
import { useDismiss } from './useDismiss'

interface LikeButtonProps {
  liked: boolean
  count: number
  // Visitors see the count but can't like or see who did
  canLike: boolean
  small?: boolean
  save: (liked: boolean) => Promise<Like>
  loadLikers: () => Promise<FeedMember[]>
  onChange: (like: Like) => void
}

const LikeButton = ({ liked, count, canLike, small = false, save, loadLikers, onChange }: LikeButtonProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [likers, setLikers] = useState<FeedMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useDismiss(rootRef, open, () => setOpen(false))

  const toggle = async () => {
    const before = { liked, likeCount: count }
    setBusy(true)
    // Shown at once; the server's answer follows and has the real count
    onChange({ liked: !liked, likeCount: count + (liked ? -1 : 1) })
    try {
      onChange(await save(!liked))
    } catch {
      onChange(before)
    } finally {
      setBusy(false)
    }
  }

  const showLikers = () => {
    setOpen(true)
    setLikers(null)
    setError(null)
    loadLikers()
      .then(setLikers)
      .catch(err => setError(errorMessage(err)))
  }

  const iconSize = small ? 14 : 18
  const textSize = small ? 'text-xs' : 'text-sm'

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        className={cn(ACTION, textSize, liked && 'text-teb-orange hover:text-teb-orange-light disabled:hover:text-teb-orange')}
        disabled={!canLike || busy}
        aria-pressed={liked}
        aria-label={liked ? 'Fjern liker' : 'Lik'}
        title={canLike ? undefined : 'Logg inn for å like'}
        onClick={toggle}
      >
        <Heart size={iconSize} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
        {!canLike && count > 0 && <span>{count}</span>}
        {canLike && count === 0 && !small && <span>Lik</span>}
      </button>

      {canLike && count > 0 && (
        <button
          type="button"
          className={`${textSize} -ml-1 rounded-md px-1.5 py-1.5 text-white/60 cursor-pointer hover:text-white hover:underline`}
          aria-label={`${count} liker. Se hvem`}
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : showLikers())}
        >
          {count}
        </button>
      )}

      {open && (
        <div className={`${MENU} left-0 top-[calc(100%+4px)] w-56 max-h-64 overflow-y-auto p-2`}>
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Likt av</p>
          {error && <p className={`${ERROR_TEXT} px-1`}>{error}</p>}
          {!likers && !error && <p className="px-1 text-sm text-white/50">Laster…</p>}
          {likers?.length === 0 && <p className="px-1 text-sm text-white/50">Ingen ennå</p>}
          <ul className="space-y-1">
            {likers?.map(member => (
              <li key={member.id} className="flex items-center gap-2 px-1 py-1 text-sm text-white/90">
                <Avatar name={member.name} path={member.avatar} className="h-6 w-6 text-[10px]" />
                <MemberLink member={member} className="truncate">
                  {member.name}
                </MemberLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default LikeButton
