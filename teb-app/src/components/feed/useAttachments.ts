import { useState } from 'react'
import { errorMessage, formatSize, MAX_ATTACHMENT_BYTES, uploadAttachment, type Attachment } from '../../lib/feed'

// Pictures are made smaller before they are uploaded, since a phone photo is several MB and
// everyone viewing the feed downloads it. Drawing it again also leaves out where it was taken.
const MAX_PICTURE_SIDE = 2048
const PICTURE_QUALITY = 0.85
// Screenshots this small stay PNG, which keeps text sharp
const KEEP_PNG_BYTES = 2 * 1024 * 1024

async function shrinkPicture(file: File): Promise<File> {
  // An animated GIF would stop moving
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // A format the browser can't read is uploaded as it is
    return file
  }

  const canvas = document.createElement('canvas')
  try {
    const scale = Math.min(1, MAX_PICTURE_SIDE / Math.max(bitmap.width, bitmap.height))
    if (file.type === 'image/png' && scale === 1 && file.size <= KEEP_PNG_BYTES) return file
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  } finally {
    bitmap.close()
  }

  const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', PICTURE_QUALITY))
  if (!jpeg) return file
  return new File([jpeg], `${file.name.replace(/\.[^.]*$/, '')}.jpg`, { type: 'image/jpeg' })
}

// The files being put on a post or comment: each is uploaded as it is chosen, and belongs
// to nothing until the post or comment is saved
export function useAttachments(token: string, max: number, initial: Attachment[] = []) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // The size limit is checked after shrinking, so large photos still get through
  const send = async (file: File) => {
    const ready = await shrinkPicture(file)
    if (ready.size > MAX_ATTACHMENT_BYTES) throw new Error(`Filen er større enn ${formatSize(MAX_ATTACHMENT_BYTES)}`)
    return uploadAttachment(token, ready)
  }

  const upload = (files: FileList | null) => {
    if (!files) return
    setError(null)
    const room = max - attachments.length - uploading
    const chosen = [...files]
    if (chosen.length > room) setError(`Du kan legge ved opptil ${max} filer`)

    for (const file of chosen.slice(0, Math.max(0, room))) {
      setUploading(n => n + 1)
      send(file)
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
