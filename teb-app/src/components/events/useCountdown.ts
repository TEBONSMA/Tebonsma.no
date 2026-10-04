import { useEffect, useState } from 'react'
import { getCountdown, type Countdown } from '../../lib/events'

// Counts down to an event that starts within a month; nothing otherwise
export function useCountdown(startsAt: string | null) {
  const [countdown, setCountdown] = useState<Countdown | null>(null)

  useEffect(() => {
    const tick = () => setCountdown(getCountdown(startsAt))
    tick()
    if (!startsAt) return
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [startsAt])

  return countdown
}
