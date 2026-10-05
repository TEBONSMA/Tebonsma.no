import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { MENU } from '../feed/styles'

interface Place {
  left: number
  // Measured from the top when the menu opens downwards, from the bottom when it opens upwards
  top?: number
  bottom?: number
}

interface PopoverMenuProps {
  trigger: (button: { onClick: (e: MouseEvent<HTMLElement>) => void; open: boolean }) => ReactNode
  children: (close: () => void) => ReactNode
  // How wide the menu is, in pixels
  width?: number
  label: string
}

const GAP = 4
const MARGIN = 8
// Below this much room under the button, the menu opens upwards if there is more room there
const ROOM_NEEDED = 320

// A menu that opens from a button. It is drawn on the page itself, not inside whatever the button
// is in, so a list or a window with its own scrolling and clipping can't cut it off.
const PopoverMenu = ({ trigger, children, width = 240, label }: PopoverMenuProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<Place | null>(null)

  const close = () => setPlace(null)

  // The menu is placed from where the button is when it is pressed
  const toggle = (e: MouseEvent<HTMLElement>) => {
    if (place) return close()
    const rect = e.currentTarget.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN))
    setPlace(
      below < ROOM_NEEDED && rect.top > below
        ? { left, bottom: window.innerHeight - rect.top + GAP }
        : { left, top: rect.bottom + GAP },
    )
  }

  useEffect(() => {
    if (!place) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setPlace(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlace(null)
    }
    // The button moves when something scrolls, so the menu would be left behind
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setPlace(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [place])

  return (
    <div ref={rootRef} className="relative">
      {trigger({ onClick: toggle, open: place !== null })}
      {place &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            style={{ left: place.left, top: place.top, bottom: place.bottom, width }}
            className={cn(MENU, 'fixed z-[120] max-h-[calc(100dvh-1rem)] overflow-y-auto')}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  )
}

export default PopoverMenu
