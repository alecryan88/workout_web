import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function useAutosave<T>(save: (value: T) => Promise<void>, delayMs = 600) {
  const [state, setState] = useState<SaveState>('idle')
  const pending = useRef<{ value: T } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chain = useRef<Promise<void>>(Promise.resolve())
  const saveRef = useRef(save)
  saveRef.current = save

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    chain.current = chain.current.then(async () => {
      const next = pending.current
      if (!next) return
      pending.current = null
      setState('saving')
      try {
        await saveRef.current(next.value)
        setState(pending.current ? 'saving' : 'saved')
      } catch {
        pending.current = pending.current ?? next
        setState('error')
      }
    })
    return chain.current
  }, [])

  const schedule = useCallback(
    (value: T) => {
      pending.current = { value }
      setState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, delayMs)
    },
    [flush, delayMs],
  )

  useEffect(() => () => void flush(), [flush])

  return { state, schedule, flush }
}
