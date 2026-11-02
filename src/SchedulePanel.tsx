import { useState } from 'react'
import DateChips from './DateChips'
import { today } from './dates'
import { WEEKDAY_NAMES, weeklyDates } from './recurrence'

type Props = {
  /** Creates the workouts. Rejects on failure. */
  onSchedule: (dates: string[]) => Promise<void>
}

type Mode = 'single' | 'weekly'

const MAX_WEEKS = 52

const workoutsText = (n: number) => (n === 1 ? '1 workout' : `${n} workouts`)

export default function SchedulePanel({ onSchedule }: Props) {
  const [mode, setMode] = useState<Mode>('single')
  const [singleDates, setSingleDates] = useState<string[]>([])
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [start, setStart] = useState(today())
  const [weeks, setWeeks] = useState('4')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dates = mode === 'single' ? singleDates : weeklyDates(start, weekdays, Math.min(MAX_WEEKS, Number(weeks) || 0))

  const toggleWeekday = (day: number) =>
    setWeekdays(weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day])

  const schedule = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSchedule(dates)
      setMessage(`Added ${workoutsText(dates.length)}`)
      setSingleDates([])
      setWeekdays([])
    } catch {
      setError('Could not schedule. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="copy-panel">
      <div className="segmented" role="group" aria-label="Schedule mode">
        <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>
          Single dates
        </button>
        <button type="button" aria-pressed={mode === 'weekly'} onClick={() => setMode('weekly')}>
          Repeat weekly
        </button>
      </div>

      {mode === 'single' ? (
        <DateChips label="Date to add" dates={singleDates} onChange={setSingleDates} />
      ) : (
        <>
          <div className="weekday-toggles" role="group" aria-label="Weekdays">
            {WEEKDAY_NAMES.map((name, day) => (
              <button key={name} type="button" aria-pressed={weekdays.includes(day)} onClick={() => toggleWeekday(day)}>
                {name}
              </button>
            ))}
          </div>
          <label>
            Start date
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            Weeks
            <input type="number" inputMode="numeric" min={1} max={MAX_WEEKS} value={weeks} onChange={(e) => setWeeks(e.target.value)} />
          </label>
        </>
      )}

      <p className="schedule-count">Creates {workoutsText(dates.length)}</p>
      <button type="button" className="primary" disabled={dates.length === 0 || busy} onClick={schedule}>
        Schedule
      </button>
      {message && <p role="status" className="ok">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  )
}
