import { FileText, X } from 'lucide-react'
import { formatSize, type Attachment } from '../../lib/feed'
import { useImageSrc } from './useImageSrc'

function Thumbnail({ attachment, token }: { attachment: Attachment; token: string }) {
  const src = useImageSrc(attachment, 'unsaved', token)
  return src ? (
    <img src={src} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
  ) : (
    <span className="h-9 w-9 shrink-0 rounded bg-white/10 animate-pulse" />
  )
}

interface AttachmentChipsProps {
  attachments: Attachment[]
  // How many files are on their way up
  uploading: number
  token: string
  onRemove: (id: string) => void
}

// The files chosen for a post or comment that is being written
const AttachmentChips = ({ attachments, uploading, token, onRemove }: AttachmentChipsProps) => {
  if (attachments.length === 0 && uploading === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map(attachment => (
        <li key={attachment.id} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 py-1 pl-1 pr-1.5 text-sm">
          {attachment.isImage ? (
            <Thumbnail attachment={attachment} token={token} />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/5">
              <FileText size={18} aria-hidden="true" className="text-white/50" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block max-w-40 truncate text-white/90">{attachment.name}</span>
            <span className="block text-xs text-white/50">{formatSize(attachment.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            aria-label={`Fjern ${attachment.name}`}
            className="rounded p-1 text-white/50 cursor-pointer hover:bg-white/10 hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
      {uploading > 0 && (
        <li className="flex items-center rounded-md border border-dashed border-white/15 px-3 text-sm text-white/50">
          Laster opp{uploading > 1 ? ` ${uploading} filer` : ''}…
        </li>
      )}
    </ul>
  )
}

export default AttachmentChips
