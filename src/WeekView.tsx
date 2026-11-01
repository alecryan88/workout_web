import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { addDays, dayLabel, monthDay, startOfWeek, today, weekDays } from './dates'
import { useStore } from './store/context'
import type { WorkoutSummary } from './store/types'

type Props = { onSignOut: () => void }

export default function WeekView({ onSignOut }: Props) {
  const store = useStore()
  const [params, setParams] = useSearchParams()
  const todayIso = today()
  const thisMonday = startOfWeek(todayIso)
  const monday = startOfWeek(params.get('week') ?? thisMonday)
  const days = weekDays(monday)
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const touchStart = useRef<number | null>(null)
  const navigate = useNavigate()

  const addWorkout = async (date: string) => {
    try {
      const id = await store.createWorkout(date, 'Workout')
      navigate(`/workout/${id}`)
    } catch {
      setError('Could not create workout. Check your connection.')
    }
  }

  useEffect(() => {
    let cancelled = false
    setError(null)
    store
      .listWorkouts(days[0], days[6])
      .then((list) => !cancelled && setWorkouts(list))
      .catch(() => !cancelled && setError('Could not load workouts. Check your connection.'))
    return () => {
      cancelled = true
    }
  }, [store, monday])

  const goTo = (newMonday: string) => {
    setParams(newMonday === thisMonday ? {} : { week: newMonday }, { replace: true })
  }

  const onTouchEnd = (x: number) => {
    if (touchStart.current === null) return
    const dx = x - touchStart.current
    touchStart.current = null
    if (Math.abs(dx) < 60) return
    goTo(addDays(monday, dx < 0 ? 7 : -7))
  }

  return (
    <main
      className="week"
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
    >
      <header className="week-header">
        <button type="button" className="icon" aria-label="Previous week" onClick={() => goTo(addDays(monday, -7))}>
          ‹
        </button>
        <h1>Week of {monthDay(monday)}</h1>
        <button type="button" className="icon" aria-label="Next week" onClick={() => goTo(addDays(monday, 7))}>
          ›
        </button>
      </header>
      <div className="week-actions">
        {monday !== thisMonday && (
          <button type="button" onClick={() => goTo(thisMonday)}>
            This week
          </button>
        )}
        <button type="button" className="link-button" onClick={onSignOut}>
          Log out
        </button>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      {days.map((iso) => {
        const dayWorkouts = (workouts ?? []).filter((w) => w.date === iso)
        const isToday = iso === todayIso
        return (
          <section
            key={iso}
            aria-label={dayLabel(iso)}
            aria-current={isToday ? 'date' : undefined}
            className={isToday ? 'day today' : 'day'}
          >
            <div className="day-header">
              <h2>{dayLabel(iso)}</h2>
              <button
                type="button"
                className="icon add"
                aria-label={`Add workout to ${dayLabel(iso)}`}
                onClick={() => addWorkout(iso)}
              >
                +
              </button>
            </div>
            {workouts && dayWorkouts.length === 0 && <p className="rest">Rest</p>}
            <ul>
              {dayWorkouts.map((w) => {
                const missed = w.status === 'planned' && w.date < todayIso
                return (
                  <li key={w.id}>
                    <Link to={`/workout/${w.id}`} className={`workout-chip ${w.status}${missed ? ' missed' : ''}`}>
                      <span>{w.name}</span>
                      {w.status === 'done' && <span className="badge">✓ Done</span>}
                      {missed && <span className="badge">Not done</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
