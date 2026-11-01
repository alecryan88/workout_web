import { dayLabel, dayNumber, shortWeekday } from './dates'
import type { WorkoutSummary } from './store/types'

type DotState = 'done' | 'missed' | 'planned'

const dotText: Record<DotState, string> = { done: 'All done', missed: 'Missed', planned: 'Planned' }

function dotState(dayWorkouts: WorkoutSummary[], today: string): DotState | null {
  if (dayWorkouts.length === 0) return null
  if (dayWorkouts.every((w) => w.status === 'done')) return 'done'
  if (dayWorkouts.some((w) => w.status === 'planned' && w.date < today)) return 'missed'
  return 'planned'
}

type Props = {
  days: string[]
  selected: string
  today: string
  workouts: WorkoutSummary[]
  onSelect: (iso: string) => void
}

export default function DayStrip({ days, selected, today, workouts, onSelect }: Props) {
  return (
    <div className="day-strip">
      {days.map((iso) => {
        const classes = ['strip-day']
        if (iso === today) classes.push('today')
        if (iso === selected) classes.push('selected')
        const dot = dotState(
          workouts.filter((w) => w.date === iso),
          today,
        )
        const dotId = `day-dot-${iso}`
        return (
          <button
            key={iso}
            type="button"
            className={classes.join(' ')}
            aria-label={dayLabel(iso)}
            aria-describedby={dot ? dotId : undefined}
            aria-pressed={iso === selected}
            aria-current={iso === today ? 'date' : undefined}
            onClick={() => onSelect(iso)}
          >
            <span className="strip-weekday">{shortWeekday(iso)}</span>
            <span className="strip-number">{dayNumber(iso)}</span>
            <span className={`strip-dot${dot ? ` ${dot}` : ''}`}>
              {dot && (
                <span id={dotId} className="visually-hidden">
                  {dotText[dot]}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
