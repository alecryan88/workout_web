import { Link } from 'react-router-dom'
import { longWeekday } from './dates'
import { isMissed, type WorkoutSummary } from './store/types'

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
          const missed = isMissed(w, today)
          return (
            <li key={w.id}>
              <Link to={`/workout/${w.id}`} className={`workout-chip card ${w.status}${missed ? ' missed' : ''}`}>
                <span className="workout-card-top">
                  <span className="workout-name">{w.name}</span>
                  {w.status === 'done' && (
                    <span className="done-check">
                      <span aria-hidden="true">✓</span>
                      <span className="visually-hidden">Done</span>
                    </span>
                  )}
                  {missed && <span className="badge">Not done</span>}
                  {w.status === 'in_progress' && <span className="badge active">In progress</span>}
                </span>
                <span className="workout-counts">
                  {w.exerciseCount} {w.exerciseCount === 1 ? 'exercise' : 'exercises'} · {w.completedSetCount}/{w.setCount} sets
                </span>
                <span
                  className="progress"
                  role="progressbar"
                  aria-label="Completed sets"
                  aria-valuemin={0}
                  aria-valuemax={w.setCount}
                  aria-valuenow={w.completedSetCount}
                >
                  <span
                    className="progress-fill"
                    style={{ width: `${w.setCount === 0 ? 0 : (w.completedSetCount / w.setCount) * 100}%` }}
                  />
                </span>
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
