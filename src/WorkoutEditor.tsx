import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { startOfWeek } from './dates'
import { useStore } from './store/context'
import CopyPanel from './CopyPanel'
import ExerciseCard from './ExerciseCard'
import ExercisePicker from './ExercisePicker'
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

export default function WorkoutEditor() {
  const { id = '' } = useParams()
  const store = useStore()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [panel, setPanel] = useState<'none' | 'copy' | 'delete'>('none')
  const autosave = useAutosave((w: Workout) => store.saveWorkout(w))

  useEffect(() => {
    store
      .getWorkout(id)
      .then((w) => (w ? setWorkout(w) : setLoadError('Workout not found.')))
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

  const toggleDone = () => {
    if (!workout) return
    update({ status: workout.status === 'done' ? 'planned' : 'done' })
    setTimeout(() => void autosave.flush())
  }

  const copy = async (dates: string[], actualsAsTargets: boolean) => {
    await autosave.flush()
    await store.copyWorkout(id, dates, { actualsAsTargets })
  }

  const remove = async () => {
    await autosave.flush()
    await store.deleteWorkout(id)
    navigate(workout ? `/?week=${startOfWeek(workout.date)}&day=${workout.date}` : '/')
  }

  const backToWeek = async () => {
    await autosave.flush()
    navigate(workout ? `/?week=${startOfWeek(workout.date)}&day=${workout.date}` : '/')
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

  return (
    <main className="editor">
      <header className="editor-header">
        <button type="button" className="link-button" aria-label="Back to week" onClick={backToWeek}>
          ‹ Back to week
        </button>
        <span className={`save-state ${autosave.state}`} role={autosave.state === 'error' ? 'alert' : 'status'}>
          {SAVE_LABELS[autosave.state]}
        </span>
      </header>

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
        <textarea rows={2} value={workout.notes} onChange={(e) => update({ notes: e.target.value })} />
      </label>

      {workout.exercises.map((entry, i) => (
        <ExerciseCard
          key={i}
          entry={entry}
          workoutDate={workout.date}
          isFirst={i === 0}
          isLast={i === workout.exercises.length - 1}
          onChange={(changed) => setExercises(workout.exercises.map((e, j) => (j === i ? changed : e)))}
          onRemove={() => setExercises(workout.exercises.filter((_, j) => j !== i))}
          onMove={(direction) => moveExercise(i, direction)}
        />
      ))}

      <ExercisePicker onPick={(exercise) => setExercises([...workout.exercises, { exercise, sets: [] }])} />

      <div className="editor-footer">
        <button type="button" className={workout.status === 'done' ? 'secondary' : 'primary done-button'} onClick={toggleDone}>
          {workout.status === 'done' ? 'Mark not done' : 'Mark done'}
        </button>
        <div className="secondary-actions">
          <button type="button" onClick={() => setPanel('copy')}>
            Copy workout
          </button>
          <button type="button" className="danger" onClick={() => setPanel('delete')}>
            Delete workout
          </button>
        </div>
      </div>

      {panel === 'copy' && <CopyPanel onCopy={copy} onClose={() => setPanel('none')} />}
      {panel === 'delete' && (
        <section className="panel" role="alertdialog" aria-label="Delete workout">
          <p>Delete “{workout.name}”? This can’t be undone.</p>
          <div className="picker-row">
            <button type="button" onClick={() => setPanel('none')}>
              Cancel
            </button>
            <button type="button" className="danger primary" onClick={remove}>
              Yes, delete
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
