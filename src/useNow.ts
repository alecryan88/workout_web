import { useEffect, useState } from 'react'

/** The current time in ms, re-rendering every `intervalMs` while `active`. */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => clearInterval(timer)
  }, [active, intervalMs])
  return Date.now()
}
