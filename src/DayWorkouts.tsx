import { Link } from 'react-router-dom'
import { longWeekday } from './dates'
import type { WorkoutSummary } from './store/types'

type Props = {
  date: string
  today: string
  workouts: WorkoutSummary[] | null
  onAdd: () => void
}

export default function DayWorkouts({ date, today, workouts, onAdd }: Props) {
  const dayWorkouts = (workouts ?? []).filter((w) => w.date === date)
  return (
    <section className="day-workouts" aria-labelledby="day-workouts-heading">
      <h2 id="day-workouts-heading">{date === today ? 'Today' : longWeekday(date)}'s workouts</h2>
      {workouts && dayWorkouts.length === 0 && <p className="rest">Rest day</p>}
      <ul>
        {dayWorkouts.map((w) => {
          const missed = w.status === 'planned' && w.date < today
          return (
            <li key={w.id}>
              <Link to={`/workout/${w.id}`} className={`workout-chip card ${w.status}${missed ? ' missed' : ''}`}>
                <span>{w.name}</span>
                {w.status === 'done' && <span className="badge">✓ Done</span>}
                {missed && <span className="badge">Not done</span>}
              </Link>
            </li>
          )
        })}
      </ul>
      <button type="button" className="add-workout primary" onClick={onAdd}>
        <span aria-hidden="true">+ </span>Add workout
      </button>
    </section>
  )
}
