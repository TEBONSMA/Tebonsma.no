import { useEffect, useMemo, useRef, useState } from 'react'

interface MailFrameProps {
  html: string
  // Pictures from other sites are only loaded when the member has asked for them
  allowImages: boolean
  title: string
}

const BASE_CSS = `
  html, body { margin: 0; padding: 0; }
  body { padding: 16px; background: #fff; color: #111; font: 15px/1.5 system-ui, sans-serif; overflow-wrap: anywhere; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  a { color: #0b57d0; }
  blockquote { margin: 8px 0; padding-left: 12px; border-left: 3px solid #ccc; color: #444; }
  pre { white-space: pre-wrap; }
`

const randomNonce = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

// A mail is somebody else's page, so it is shown in a frame with no access to the site: the
// frame is sandboxed, and its content policy blocks everything except pictures and one
// small script of ours that reports how tall the mail is. The API has already removed
// anything that could run; this is a second wall.
const MailFrame = ({ html, allowImages, title }: MailFrameProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(120)
  const [nonce] = useState(randomNonce)

  const srcDoc = useMemo(() => {
    const images = allowImages ? 'data: https: http:' : 'data:'
    const policy = `default-src 'none'; img-src ${images}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'`
    const report = `
      const send = () => parent.postMessage({ mailFrameHeight: document.documentElement.scrollHeight }, '*')
      new ResizeObserver(send).observe(document.body)
      addEventListener('load', send)
    `
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><base target="_blank"><style>${BASE_CSS}</style></head><body>${html}<script nonce="${nonce}">${report}</script></body></html>`
  }, [html, allowImages, nonce])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return
      const next = (event.data as { mailFrameHeight?: unknown } | null)?.mailFrameHeight
      if (typeof next === 'number' && Number.isFinite(next)) setHeight(Math.min(Math.max(next, 60), 20_000))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      className="block w-full rounded-md bg-white"
      style={{ height }}
    />
  )
}

export default MailFrame
