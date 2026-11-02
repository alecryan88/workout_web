import { useState } from 'react'
import DateChips from './DateChips'

type Props = {
  onCopy: (dates: string[], tickedOnly: boolean) => Promise<void>
}

const plural = (n: number) => (n === 1 ? '1 date' : `${n} dates`)

export default function CopyPanel({ onCopy }: Props) {
  const [dates, setDates] = useState<string[]>([])
  const [tickedOnly, setTickedOnly] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const copy = async () => {
    setBusy(true)
    setError(null)
    try {
      await onCopy(dates, tickedOnly)
      setMessage(`Copied to ${plural(dates.length)}`)
      setDates([])
    } catch {
      setError('Could not copy. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="copy-panel">
      <DateChips label="Copy to date" dates={dates} onChange={setDates} />
      <label className="checkbox">
        <input type="checkbox" checked={tickedOnly} onChange={(e) => setTickedOnly(e.target.checked)} />
        Copy ticked values only
      </label>
      <button type="button" className="primary" disabled={dates.length === 0 || busy} onClick={copy}>
        Copy to {plural(dates.length)}
      </button>
      {message && <p role="status" className="ok">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  )
}
