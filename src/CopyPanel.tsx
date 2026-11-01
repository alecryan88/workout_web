import { useState } from 'react'
import { dayLabel } from './dates'

type Props = {
  onCopy: (dates: string[], actualsAsTargets: boolean) => Promise<void>
}

const plural = (n: number) => (n === 1 ? '1 date' : `${n} dates`)

export default function CopyPanel({ onCopy }: Props) {
  const [draft, setDraft] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [actualsAsTargets, setActualsAsTargets] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const addDate = () => {
    if (draft && !dates.includes(draft)) setDates([...dates, draft].sort())
    setDraft('')
  }

  const copy = async () => {
    setBusy(true)
    setError(null)
    try {
      await onCopy(dates, actualsAsTargets)
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
      <div className="picker-row">
        <input type="date" aria-label="Copy to date" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" onClick={addDate} disabled={!draft}>
          Add date
        </button>
      </div>
      {dates.length > 0 && (
        <ul className="chips">
          {dates.map((d) => (
            <li key={d}>
              {dayLabel(d)}
              <button type="button" className="icon" aria-label={`Remove ${dayLabel(d)}`} onClick={() => setDates(dates.filter((x) => x !== d))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="checkbox">
        <input type="checkbox" checked={actualsAsTargets} onChange={(e) => setActualsAsTargets(e.target.checked)} />
        Use actuals as new targets
      </label>
      <button type="button" className="primary" disabled={dates.length === 0 || busy} onClick={copy}>
        Copy to {plural(dates.length)}
      </button>
      {message && <p role="status" className="ok">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  )
}
