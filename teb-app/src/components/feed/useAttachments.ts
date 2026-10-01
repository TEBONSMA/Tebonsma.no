import { useState } from 'react'
import { errorMessage, formatSize, MAX_ATTACHMENT_BYTES, uploadAttachment, type Attachment } from '../../lib/feed'

// The files being put on a post or comment: each is uploaded as it is chosen, and belongs
// to nothing until the post or comment is saved
export function useAttachments(token: string, max: number, initial: Attachment[] = []) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = (files: FileList | null) => {
    if (!files) return
    setError(null)
    const room = max - attachments.length - uploading
    const chosen = [...files]
    if (chosen.length > room) setError(`Du kan legge ved opptil ${max} filer`)

    for (const file of chosen.slice(0, Math.max(0, room))) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`${file.name} er større enn ${formatSize(MAX_ATTACHMENT_BYTES)}`)
        continue
      }
      setUploading(n => n + 1)
      uploadAttachment(token, file)
        .then(uploaded => setAttachments(list => [...list, uploaded]))
        .catch(err => setError(`${file.name}: ${errorMessage(err)}`))
        .finally(() => setUploading(n => n - 1))
    }
  }

  return {
    attachments,
    uploading,
    error,
    upload,
    remove: (id: string) => setAttachments(list => list.filter(a => a.id !== id)),
    clear: () => setAttachments([]),
  }
}
