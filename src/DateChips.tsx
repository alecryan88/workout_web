import { useState } from 'react'
import { dayLabel } from './dates'

type Props = {
  label: string
  dates: string[]
  onChange: (dates: string[]) => void
}

/** A date field with "Add date" that collects a sorted list of distinct dates as removable chips. */
export default function DateChips({ label, dates, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const addDate = () => {
    if (draft && !dates.includes(draft)) onChange([...dates, draft].sort())
    setDraft('')
  }

  return (
    <>
      <div className="picker-row">
        <input type="date" aria-label={label} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" onClick={addDate} disabled={!draft}>
          Add date
        </button>
      </div>
      {dates.length > 0 && (
        <ul className="chips">
          {dates.map((d) => (
            <li key={d}>
              {dayLabel(d)}
              <button type="button" className="icon" aria-label={`Remove ${dayLabel(d)}`} onClick={() => onChange(dates.filter((x) => x !== d))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
