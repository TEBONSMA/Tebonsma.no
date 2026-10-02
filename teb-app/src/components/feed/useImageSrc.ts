import { useEffect, useState } from 'react'
import { apiFetchBlob, apiUrl } from '../../lib/api'
import { isDirect, type Attachment, type Visibility } from '../../lib/feed'

// The address to show a picture from. Pictures on members-only posts, and uploads that
// aren't in a post yet, are fetched with the login first; until then there is no address.
export function useImageSrc(attachment: Attachment, visibility: Visibility | 'unsaved', token: string | null) {
  const { id, url } = attachment
  const direct = visibility !== 'unsaved' && isDirect(visibility)
  const [fetched, setFetched] = useState<{ id: string; src: string } | null>(null)

  useEffect(() => {
    if (direct || !token) return
    let active = true
    let src: string | null = null
    apiFetchBlob(url, token)
      .then(blob => {
        if (!active) return
        src = URL.createObjectURL(blob)
        setFetched({ id, src })
      })
      .catch(() => {})
    return () => {
      active = false
      if (src) URL.revokeObjectURL(src)
    }
  }, [id, url, direct, token])

  if (direct) return apiUrl(url)
  return fetched?.id === id ? fetched.src : null
}
