import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { startOfWeek } from './dates'
import { useStore } from './store/context'
import CopyPanel from './CopyPanel'
import ExerciseCard from './ExerciseCard'
import ExercisePicker from './ExercisePicker'
import Sheet from './Sheet'
import type { Workout, WorkoutExercise } from './store/types'
import { useAutosave, type SaveState } from './useAutosave'

const SAVE_LABELS: Record<SaveState, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Couldn’t save. Check your connection.',
}

function DateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <input
      type="date"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        if (e.target.value) onChange(e.target.value)
      }}
    />
  )
}

type EditorSheet = 'none' | 'actions' | 'details' | 'copy' | 'delete'

const weekUrl = (workout: Workout | null) => (workout ? `/?week=${startOfWeek(workout.date)}&day=${workout.date}` : '/')

export default function WorkoutEditor() {
  const { id = '' } = useParams()
  const store = useStore()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<EditorSheet>('none')
  const autosave = useAutosave((w: Workout) => store.saveWorkout(w))

  useEffect(() => {
    store
      .getWorkout(id)
      .then((w) => {
        if (!w) return setLoadError('Workout not found.')
        setWorkout(w)
      })
      .catch(() => setLoadError('Could not load workout. Check your connection.'))
  }, [store, id])

  const update = (changes: Partial<Workout>) => {
    if (!workout) return
    const next = { ...workout, ...changes }
    setWorkout(next)
    autosave.schedule(next)
  }

  const setExercises = (exercises: WorkoutExercise[]) => update({ exercises })

  const moveExercise = (index: number, direction: -1 | 1) => {
    if (!workout) return
    const next = [...workout.exercises]
    const [item] = next.splice(index, 1)
    next.splice(index + direction, 0, item)
    setExercises(next)
  }

  const removeExercise = (index: number) => {
    if (!workout) return
    setExercises(workout.exercises.filter((_, j) => j !== index))
  }

  const toggleDone = () => {
    if (!workout) return
    update({ status: workout.status === 'done' ? 'planned' : 'done' })
    setTimeout(() => void autosave.flush())
  }

  const copy = async (dates: string[], tickedOnly: boolean) => {
    await autosave.flush()
    await store.copyWorkout(id, dates, { tickedOnly })
  }

  const remove = async () => {
    await autosave.flush()
    await store.deleteWorkout(id)
    navigate(weekUrl(workout))
  }

  const backToWeek = async () => {
    await autosave.flush()
    navigate(weekUrl(workout))
  }

  if (loadError) {
    return (
      <main>
        <p role="alert" className="error">{loadError}</p>
        <button type="button" onClick={() => navigate('/')}>Back to week</button>
      </main>
    )
  }

  if (!workout) return null

  const closeSheet = () => setSheet('none')

  return (
    <main className="editor">
      <header className="editor-header">
        <button type="button" className="link-button nav-back" aria-label="Back to week" onClick={backToWeek}>
          ‹ Week
        </button>
        <div className="nav-title">
          <h1>{workout.name}</h1>
          <span className={`save-state ${autosave.state}`} role={autosave.state === 'error' ? 'alert' : 'status'}>
            {SAVE_LABELS[autosave.state]}
          </span>
        </div>
        <button type="button" className="link-button nav-more" aria-label="Workout actions" onClick={() => setSheet('actions')}>
          •••
        </button>
      </header>

      {workout.notes && <p className="workout-notes">{workout.notes}</p>}

      {workout.exercises.map((entry, i) => (
        <ExerciseCard
          key={i}
          entry={entry}
          workoutDate={workout.date}
          isFirst={i === 0}
          isLast={i === workout.exercises.length - 1}
          onChange={(changed) => setExercises(workout.exercises.map((e, j) => (j === i ? changed : e)))}
          onRemove={() => removeExercise(i)}
          onMove={(direction) => moveExercise(i, direction)}
        />
      ))}

      <ExercisePicker
        onPick={(exercise) => setExercises([...workout.exercises, { exercise, sets: [] }])}
      />

      <div className="bottom-bar">
        <button type="button" className={workout.status === 'done' ? 'secondary' : 'primary done-button'} onClick={toggleDone}>
          {workout.status === 'done' ? 'Mark not done' : 'Mark done'}
        </button>
      </div>

      <Sheet open={sheet === 'actions'} title="Workout actions" onClose={closeSheet}>
        <button type="button" onClick={() => setSheet('details')}>
          Edit details
        </button>
        <button type="button" onClick={() => setSheet('copy')}>
          Copy
        </button>
        <button type="button" className="danger" onClick={() => setSheet('delete')}>
          Delete
        </button>
      </Sheet>

      <Sheet open={sheet === 'details'} title="Edit details" onClose={closeSheet} cancelLabel="Done">
        <label>
          Workout name
          <input value={workout.name} onChange={(e) => update({ name: e.target.value })} />
        </label>
        <label>
          Date
          <DateInput value={workout.date} onChange={(date) => update({ date })} />
        </label>
        <label>
          Notes
          <textarea rows={3} value={workout.notes} onChange={(e) => update({ notes: e.target.value })} />
        </label>
      </Sheet>

      <Sheet open={sheet === 'copy'} title="Copy workout" onClose={closeSheet} cancelLabel="Close">
        <CopyPanel onCopy={copy} />
      </Sheet>

      <Sheet open={sheet === 'delete'} title="Delete workout" onClose={closeSheet}>
        <p>Delete “{workout.name}”? This can’t be undone.</p>
        <button type="button" className="danger" onClick={remove}>
          Yes, delete
        </button>
      </Sheet>
    </main>
  )
}
