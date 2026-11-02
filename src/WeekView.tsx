import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DayStrip from './DayStrip'
import DayWorkouts from './DayWorkouts'
import WeekHeader from './WeekHeader'
import { addDays, startOfWeek, today, weekDays } from './dates'
import Sheet from './Sheet'
import { useStore } from './store/context'
import type { TemplateSummary, WorkoutSummary } from './store/types'

type Props = { onSignOut: () => void }

export default function WeekView({ onSignOut }: Props) {
  const store = useStore()
  const [params, setParams] = useSearchParams()
  const todayIso = today()
  const thisMonday = startOfWeek(todayIso)
  const monday = startOfWeek(params.get('week') ?? thisMonday)
  const days = weekDays(monday)
  const requestedDay = params.get('day')
  const selected =
    requestedDay && days.includes(requestedDay) ? requestedDay : monday === thisMonday ? todayIso : monday
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const touchStart = useRef<number | null>(null)
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<'none' | 'settings' | 'add' | 'choose'>('none')
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null)
  const closeSheet = () => setSheet('none')

  const create = async (makeWorkout: () => Promise<string>) => {
    closeSheet()
    try {
      navigate(`/workout/${await makeWorkout()}`)
    } catch {
      setError('Could not create workout. Check your connection.')
    }
  }

  const addEmpty = () => create(() => store.createWorkout(selected, 'Workout'))
  const addFromTemplate = (templateId: string) =>
    create(async () => (await store.scheduleTemplate(templateId, [selected]))[0])

  const chooseTemplate = () => {
    setSheet('choose')
    setTemplates(null)
    store
      .listTemplates()
      .then(setTemplates)
      .catch(() => {
        closeSheet()
        setError('Could not load templates. Check your connection.')
      })
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

  const select = (iso: string) => {
    setParams({ week: monday, day: iso }, { replace: true })
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
      <WeekHeader
        monday={monday}
        sunday={days[6]}
        showToday={monday !== thisMonday}
        onToday={() => goTo(thisMonday)}
        onPrevious={() => goTo(addDays(monday, -7))}
        onNext={() => goTo(addDays(monday, 7))}
        trailing={
          <button type="button" className="icon gear" aria-label="Settings" onClick={() => setSheet('settings')}>
            ⚙
          </button>
        }
      />
      <Sheet open={sheet === 'settings'} title="Settings" onClose={closeSheet}>
        <button type="button" className="danger" onClick={onSignOut}>
          Log out
        </button>
      </Sheet>
      <Sheet open={sheet === 'add'} title="Add workout" onClose={closeSheet}>
        <button type="button" onClick={chooseTemplate}>
          From template…
        </button>
        <button type="button" onClick={addEmpty}>
          Empty workout
        </button>
      </Sheet>
      <Sheet open={sheet === 'choose'} title="Choose a template" onClose={closeSheet}>
        {templates?.length === 0 && <p className="rest">No templates yet. Create one in the Templates tab.</p>}
        {templates?.map((t) => (
          <button key={t.id} type="button" onClick={() => addFromTemplate(t.id)}>
            {t.name}
          </button>
        ))}
      </Sheet>
      <DayStrip days={days} selected={selected} today={todayIso} workouts={workouts ?? []} onSelect={select} />
      {error && <p role="alert" className="error">{error}</p>}
      <DayWorkouts date={selected} today={todayIso} workouts={workouts} onAdd={() => setSheet('add')} />
    </main>
  )
}
