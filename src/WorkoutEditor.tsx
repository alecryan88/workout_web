import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fullDate, startOfWeek } from './dates'
import { useStore } from './store/context'
import CopyPanel from './CopyPanel'
import ExerciseBlock from './ExerciseBlock'
import ExercisePicker from './ExercisePicker'
import { moveItem, removeItem, replaceItem } from './listOps'
import Sheet from './Sheet'
import {
  DEFAULT_REST_SECONDS,
  WorkoutInProgressError,
  durationSeconds,
  type PlannedSet,
  type Workout,
  type WorkoutExercise,
} from './store/types'
import { elapsed } from './time'
import { useNow } from './useNow'
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

type EditorSheet = 'none' | 'actions' | 'details' | 'copy' | 'delete' | 'finish' | 'busy'

const unticked = (values: PlannedSet) => ({ ...values, completed: false })

const weekUrl = (workout: Workout | null) => (workout ? `/?week=${startOfWeek(workout.date)}&day=${workout.date}` : '/')

export default function WorkoutEditor() {
  const { id = '' } = useParams()
  const store = useStore()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<EditorSheet>('none')
  const [actionError, setActionError] = useState<string | null>(null)
  const [activeWorkout, setActiveWorkout] = useState<{ id: string; name: string } | null>(null)
  const autosave = useAutosave((w: Workout) => store.saveWorkout(w))
  const now = useNow(workout?.status === 'in_progress')

  useEffect(() => {
    setWorkout(null)
    setSheet('none')
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

  const saveAsTemplate = async () => {
    await autosave.flush()
    try {
      const templateId = await store.createTemplateFromWorkout(id)
      navigate(`/template/${templateId}`)
    } catch {
      setSheet('none')
      setActionError('Could not save as template. Check your connection.')
    }
  }

  /** Saves pending edits, runs a lifecycle change, then reloads the workout's status and times. */
  const lifecycle = async (change: () => Promise<void>, failure: string) => {
    setSheet('none')
    setActionError(null)
    try {
      await autosave.flush()
      await change()
      const fresh = await store.getWorkout(id)
      if (fresh) setWorkout(fresh)
    } catch (e) {
      if (e instanceof WorkoutInProgressError) {
        setActiveWorkout(e.active)
        setSheet('busy')
      } else {
        setActionError(failure)
      }
    }
  }

  const start = () => lifecycle(() => store.startWorkout(id), 'Could not start. Check your connection.')
  const finish = () => lifecycle(() => store.finishWorkout(id), 'Could not finish. Check your connection.')
  const markNotDone = () => lifecycle(() => store.setStatus(id, 'planned'), 'Could not update. Check your connection.')

  const untickedCount = workout ? workout.exercises.flatMap((e) => e.sets).filter((s) => !s.completed).length : 0
  const requestFinish = () => (untickedCount > 0 ? setSheet('finish') : void finish())

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
  const inProgress = workout.status === 'in_progress'
  const sinceStart = workout.startedAt ? elapsed((now - Date.parse(workout.startedAt)) / 1000) : ''
  const duration = workout.status === 'done' ? durationSeconds(workout) : null

  return (
    <main className="editor">
      <header className="editor-header">
        <button type="button" className="link-button nav-back" aria-label="Back to week" onClick={backToWeek}>
          ‹ Week
        </button>
        <div className="nav-title">
          {inProgress && (
            <span className="nav-timer" role="timer" aria-label="Elapsed time">
              {sinceStart}
            </span>
          )}
          <span className={`save-state ${autosave.state}`} role={autosave.state === 'error' ? 'alert' : 'status'}>
            {SAVE_LABELS[autosave.state]}
          </span>
        </div>
        {workout.status !== 'done' ? (
          <button type="button" className="finish" onClick={requestFinish}>
            Finish
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className="title-row">
        <h1>{workout.name}</h1>
        <button type="button" className="chip" aria-label="Workout actions" onClick={() => setSheet('actions')}>
          •••
        </button>
      </div>
      <p className="meta-line">
        <span aria-hidden="true">📅</span>
        <span>{fullDate(workout.date)}</span>
      </p>
      {inProgress && (
        <p className="meta-line">
          <span aria-hidden="true">🕒</span>
          <span className="visually-hidden">Elapsed</span>
          <span>{sinceStart}</span>
        </p>
      )}
      {duration !== null && (
        <p className="meta-line">
          <span aria-hidden="true">🕒</span>
          <span className="visually-hidden">Duration</span>
          <span>{elapsed(duration)}</span>
        </p>
      )}
      {workout.notes && <p className="workout-notes">{workout.notes}</p>}

      {actionError && <p role="alert" className="error">{actionError}</p>}

      {workout.exercises.map((entry, i) => (
        <ExerciseBlock
          key={i}
          entry={entry}
          previousBefore={workout.date}
          tickable
          makeSet={unticked}
          isFirst={i === 0}
          isLast={i === workout.exercises.length - 1}
          onChange={(changed) => setExercises(replaceItem(workout.exercises, i, changed))}
          onRemove={() => setExercises(removeItem(workout.exercises, i))}
          onMove={(direction) => setExercises(moveItem(workout.exercises, i, direction))}
        />
      ))}

      <ExercisePicker
        onPick={(exercise) => setExercises([...workout.exercises, { exercise, restSeconds: DEFAULT_REST_SECONDS, sets: [] }])}
      />

      {workout.status === 'planned' && (
        <div className="bottom-bar">
          <button type="button" className="primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      <Sheet open={sheet === 'actions'} title="Workout actions" onClose={closeSheet}>
        <button type="button" onClick={() => setSheet('details')}>
          Edit details
        </button>
        <button type="button" onClick={() => setSheet('copy')}>
          Copy
        </button>
        <button type="button" onClick={saveAsTemplate}>
          Save as template
        </button>
        {workout.status === 'done' && (
          <button type="button" onClick={markNotDone}>
            Mark not done
          </button>
        )}
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

      <Sheet open={sheet === 'finish'} title="Finish workout?" onClose={closeSheet}>
        <p>
          {untickedCount === 1 ? '1 set isn’t ticked' : `${untickedCount} sets aren’t ticked`}. Unticked sets count as not done.
        </p>
        <button type="button" className="finish" onClick={finish}>
          Finish anyway
        </button>
      </Sheet>

      <Sheet open={sheet === 'busy'} title="Workout in progress" onClose={closeSheet}>
        {activeWorkout && (
          <>
            <p>Finish “{activeWorkout.name}” first. Only one workout can be in progress at a time.</p>
            <button type="button" onClick={() => navigate(`/workout/${activeWorkout.id}`)}>
              Open {activeWorkout.name}
            </button>
          </>
        )}
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
