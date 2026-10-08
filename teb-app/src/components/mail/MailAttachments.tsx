import { useEffect, useState } from 'react'
import { Download, File, FileArchive, FileText, Music, Video } from 'lucide-react'
import { errorMessage, formatSize } from '../../lib/feed'
import type { MailAttachment } from '../../lib/mail'
import { ERROR_TEXT } from '../feed/styles'

interface MailAttachmentsProps {
  attachments: MailAttachment[]
  // Gets the file itself; pictures are fetched straight away to show a preview
  load: (attachment: MailAttachment) => Promise<Blob>
}

const isPreviewable = (a: MailAttachment) => /^image\/(png|jpe?g|gif|webp|avif|bmp)$/i.test(a.mime)

function iconFor(mime: string) {
  if (mime.startsWith('video/')) return Video
  if (mime.startsWith('audio/')) return Music
  if (mime === 'application/pdf' || mime.startsWith('text/')) return FileText
  if (/zip|compressed|tar|rar|7z/i.test(mime)) return FileArchive
  return File
}

function save(blob: Blob, name: string) {
  const link = document.createElement('a')
  link.download = name
  link.href = URL.createObjectURL(blob)
  link.click()
  // Give the browser a moment to start the download before the address stops working
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000)
}

// Pictures show as a preview that opens full size; other files show as a chip that downloads
const MailAttachments = ({ attachments, load }: MailAttachmentsProps) => {
  const [previews, setPreviews] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const urls: string[] = []
    for (const a of attachments.filter(isPreviewable)) {
      load(a)
        .then(blob => {
          const url = URL.createObjectURL(blob)
          if (!active) return URL.revokeObjectURL(url)
          urls.push(url)
          setPreviews(p => ({ ...p, [a.n]: url }))
        })
        .catch(() => {})
    }
    return () => {
      active = false
      urls.forEach(URL.revokeObjectURL)
    }
    // load is recreated on every render by the callers; the attachments identify the files
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments])

  const download = (a: MailAttachment) => {
    setError(null)
    load(a).then(blob => save(blob, a.name)).catch(err => setError(errorMessage(err)))
  }

  const images = attachments.filter(isPreviewable)
  const files = attachments.filter(a => !isPreviewable(a))

  return (
    <section aria-label="Vedlegg" className="space-y-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map(a => (
            <li key={a.n} className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {previews[a.n] ? (
                <a href={previews[a.n]} target="_blank" rel="noreferrer" title={a.name}>
                  <img src={previews[a.n]} alt={a.name} className="aspect-[4/3] w-full object-cover" />
                </a>
              ) : (
                <div className="aspect-[4/3] w-full animate-pulse bg-white/5" />
              )}
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                <span className="min-w-0 truncate text-white/70">{a.name}</span>
                <button type="button" onClick={() => download(a)} title="Last ned" className="shrink-0 cursor-pointer text-white/50 hover:text-white">
                  <Download size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map(a => {
            const Icon = iconFor(a.mime)
            return (
              <li key={a.n}>
                <button
                  type="button"
                  onClick={() => download(a)}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm cursor-pointer transition-colors hover:border-white/20"
                >
                  <Icon size={20} aria-hidden="true" className="shrink-0 text-white/50" />
                  <span className="min-w-0">
                    <span className="block max-w-48 truncate text-white/90">{a.name}</span>
                    <span className="block text-xs text-white/50">{formatSize(a.size)}</span>
                  </span>
                  <Download size={14} aria-hidden="true" className="shrink-0 text-white/40" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {error && <p className={ERROR_TEXT}>{error}</p>}
    </section>
  )
}

export default MailAttachments
