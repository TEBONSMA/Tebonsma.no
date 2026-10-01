import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { cn } from '../../lib/utils'
import { deletePost, dismissReports, errorMessage, listReports, timeAgo, type Report } from '../../lib/feed'
import { BUTTON_DANGER, BUTTON_GHOST, CARD, ERROR_TEXT } from './styles'

interface ReportsProps {
  token: string
  onPostDeleted: (id: string) => void
}

// For administrators: posts that members have reported, to delete or let be
const Reports = ({ token, onPostDeleted }: ReportsProps) => {
  const [reports, setReports] = useState<Report[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listReports(token)
      .then(loaded => {
        if (active) setReports(loaded)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [token])

  if (reports.length === 0) return null

  const handle = async (postId: string, action: 'dismiss' | 'delete') => {
    setBusy(true)
    setError(null)
    try {
      if (action === 'delete') {
        await deletePost(token, postId)
        onPostDeleted(postId)
      } else {
        await dismissReports(token, postId)
      }
      setReports(reports.filter(report => report.post.id !== postId))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={cn(CARD, 'border-red-400/30 space-y-4 p-4 md:p-5')}>
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <Flag size={18} aria-hidden="true" className="text-red-300" />
        Rapporterte innlegg ({reports.length})
      </h2>
      <ul className="space-y-4">
        {reports.map(({ post, reports: reasons }) => (
          <li key={post.id} className="space-y-2 border-t border-white/10 pt-4">
            <p className="text-sm text-white/90">
              <span className="font-semibold">{post.author.name}:</span>{' '}
              <span className="break-words text-white/70">
                {post.body ? (post.body.length > 160 ? `${post.body.slice(0, 160)}…` : post.body) : '(kun vedlegg)'}
              </span>
            </p>
            <ul className="space-y-1 text-sm text-white/60">
              {reasons.map(reason => (
                <li key={reason.reporter.id}>
                  Rapportert av {reason.reporter.name} {timeAgo(reason.createdAt)}
                  {reason.reason && <span className="text-white/80">: «{reason.reason}»</span>}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Link to={`/feed/${post.id}`} className={BUTTON_GHOST}>
                Se innlegget
              </Link>
              <button type="button" className={BUTTON_GHOST} disabled={busy} onClick={() => handle(post.id, 'dismiss')}>
                Avvis rapporten
              </button>
              <button type="button" className={BUTTON_DANGER} disabled={busy} onClick={() => handle(post.id, 'delete')}>
                Slett innlegget
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </section>
  )
}

export default Reports
