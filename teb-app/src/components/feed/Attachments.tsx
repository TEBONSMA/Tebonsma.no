import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { downloadAttachment, errorMessage, formatSize, type Attachment, type Visibility } from '../../lib/feed'
import { ERROR_TEXT } from './styles'
import { useImageSrc } from './useImageSrc'

function Picture({ attachment, visibility, token, single }: {
  attachment: Attachment
  visibility: Visibility
  token: string | null
  single: boolean
}) {
  const src = useImageSrc(attachment, visibility, token)
  const frame = single ? 'max-h-[480px]' : 'aspect-square'

  if (!src) return <div className={`w-full rounded-md bg-white/5 animate-pulse ${single ? 'h-64' : frame}`} />
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md bg-black/30">
      <img
        src={src}
        alt={attachment.name}
        loading="lazy"
        className={`w-full ${frame} ${single ? 'object-contain' : 'object-cover'}`}
      />
    </a>
  )
}

interface AttachmentsProps {
  attachments: Attachment[]
  visibility: Visibility
  token: string | null
}

const Attachments = ({ attachments, visibility, token }: AttachmentsProps) => {
  const [error, setError] = useState<string | null>(null)
  const pictures = attachments.filter(a => a.isImage)
  const files = attachments.filter(a => !a.isImage)

  const download = (attachment: Attachment) => {
    setError(null)
    downloadAttachment(token, attachment, visibility).catch(err => setError(errorMessage(err)))
  }

  return (
    <div className="space-y-2">
      {pictures.length > 0 && (
        <div className={`grid gap-2 ${pictures.length > 1 ? 'grid-cols-2' : ''}`}>
          {pictures.map(picture => (
            <Picture
              key={picture.id}
              attachment={picture}
              visibility={visibility}
              token={token}
              single={pictures.length === 1}
            />
          ))}
        </div>
      )}
      {files.map(file => (
        <button
          key={file.id}
          type="button"
          onClick={() => download(file)}
          className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left cursor-pointer transition-colors hover:border-white/20"
        >
          <FileText size={20} aria-hidden="true" className="shrink-0 text-white/50" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-white">{file.name}</span>
            <span className="block text-xs text-white/50">{formatSize(file.size)}</span>
          </span>
          <Download size={18} aria-hidden="true" className="shrink-0 text-white/50" />
        </button>
      ))}
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </div>
  )
}

export default Attachments
