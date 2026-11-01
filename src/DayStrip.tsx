import { dayLabel, dayNumber, shortWeekday } from './dates'

type Props = {
  days: string[]
  selected: string
  today: string
  onSelect: (iso: string) => void
}

export default function DayStrip({ days, selected, today, onSelect }: Props) {
  return (
    <div className="day-strip">
      {days.map((iso) => {
        const classes = ['strip-day']
        if (iso === today) classes.push('today')
        if (iso === selected) classes.push('selected')
        return (
          <button
            key={iso}
            type="button"
            className={classes.join(' ')}
            aria-label={dayLabel(iso)}
            aria-pressed={iso === selected}
            aria-current={iso === today ? 'date' : undefined}
            onClick={() => onSelect(iso)}
          >
            <span className="strip-weekday">{shortWeekday(iso)}</span>
            <span className="strip-number">{dayNumber(iso)}</span>
          </button>
        )
      })}
    </div>
  )
}
