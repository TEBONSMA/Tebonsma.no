import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BUTTON_GHOST } from '../feed/styles'

interface UndoToastProps {
  // What happened: "Mail sendt"
  message: string
  // When the chance to take it back runs out. Without it the message is only shown for a moment.
  until: string | null
  onUndo: () => void
  onDone: () => void
  busy: boolean
  error: string | null
}

const SHOWN_MS = 4000

// "Mail sendt · Angre", on screen for as long as sending can still be taken back
const UndoToast = ({ message, until, onUndo, onDone, busy, error }: UndoToastProps) => {
  const [now, setNow] = useState(() => Date.now())
  const end = until ? new Date(until).getTime() : null
  // The parent makes a new onDone each time it renders, which mustn't restart the timer
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])

  const left = end === null ? 0 : Math.max(0, Math.ceil((end - now) / 1000))
  const canUndo = end !== null && end > now

  useEffect(() => {
    // Stays while there is something to take back, then a moment longer so it can be read
    const wait = end === null ? SHOWN_MS : Math.max(0, end - Date.now()) + SHOWN_MS / 2
    const timer = setTimeout(() => doneRef.current(), error ? 8000 : wait)
    return () => clearTimeout(timer)
  }, [end, error])

  return createPortal(
    <div role="status" className="fixed bottom-4 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <span>{error ?? message}</span>
      {canUndo && !error && (
        <button type="button" className={BUTTON_GHOST} onClick={onUndo} disabled={busy}>
          Angre ({left})
        </button>
      )}
    </div>,
    document.body,
  )
}

export default UndoToast
