import { useEffect, useState, type FormEvent } from 'react'
import Sheet from './Sheet'
import { useStore } from './store/context'
import {
  DuplicateExerciseError,
  EQUIPMENT,
  MUSCLE_GROUPS,
  capitalise,
  displayName,
  type Exercise,
  type ExerciseInput,
  type MuscleGroup,
} from './store/types'

const blank: ExerciseInput = { name: '', equipment: 'other', muscleGroup: null, notes: '' }

type Editing = { mode: 'new'; draft: ExerciseInput } | { mode: 'edit'; draft: Exercise; confirmDelete: boolean }

export default function ExercisesScreen() {
  const store = useStore()
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const reload = () =>
    store
      .listExercises()
      .then(setExercises)
      .catch(() => setError('Could not load exercises. Check your connection.'))

  useEffect(() => {
    void reload()
  }, [store])

  const open = (next: Editing) => {
    setFormError(null)
    setEditing(next)
  }
  const close = () => setEditing(null)

  const setDraft = (changes: Partial<ExerciseInput>) =>
    editing && setEditing({ ...editing, draft: { ...editing.draft, ...changes } } as Editing)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !editing.draft.name.trim()) return
    try {
      if (editing.mode === 'new') await store.createExercise(editing.draft)
      else await store.updateExercise(editing.draft)
      close()
      await reload()
    } catch (e) {
      setFormError(e instanceof DuplicateExerciseError ? e.message : 'Could not save. Check your connection.')
    }
  }

  const remove = async () => {
    if (editing?.mode !== 'edit') return
    const { draft } = editing
    try {
      const result = await store.deleteExercise(draft.id)
      setMessage(
        result === 'archived'
          ? `${displayName(draft)} was archived. It’s hidden but its history is kept.`
          : `${displayName(draft)} was deleted.`,
      )
      close()
      await reload()
    } catch {
      setFormError('Could not delete. Check your connection.')
    }
  }

  const needle = query.trim().toLowerCase()
  const visible = (exercises ?? []).filter((e) => !needle || displayName(e).toLowerCase().includes(needle))

  return (
    <main className="tab-screen">
      <header className="screen-header">
        <h1>Exercises</h1>
        <button type="button" className="chip" aria-label="New exercise" onClick={() => open({ mode: 'new', draft: blank })}>
          + New
        </button>
      </header>
      <input type="search" aria-label="Search exercises" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="ok">{message}</p>}
      {exercises && exercises.length === 0 && <p className="rest">No exercises yet.</p>}
      {exercises && exercises.length > 0 && visible.length === 0 && <p className="rest">No exercises match “{query.trim()}”.</p>}
      <ul className="exercise-list" aria-label="Exercises">
        {visible.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              aria-label={displayName(exercise)}
              onClick={() => open({ mode: 'edit', draft: exercise, confirmDelete: false })}
            >
              <span className="exercise-list-name">{displayName(exercise)}</span>
              {exercise.muscleGroup && <span className="exercise-list-meta">{capitalise(exercise.muscleGroup)}</span>}
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={editing !== null} title={editing?.mode === 'edit' ? 'Edit exercise' : 'New exercise'} onClose={close}>
        {editing && (
          <form className="exercise-form" onSubmit={save}>
            <label>
              Name
              <input value={editing.draft.name} autoCapitalize="words" onChange={(e) => setDraft({ name: e.target.value })} />
            </label>
            <label>
              Equipment
              <select
                value={editing.draft.equipment}
                onChange={(e) => setDraft({ equipment: e.target.value as ExerciseInput['equipment'] })}
              >
                {EQUIPMENT.map((value) => (
                  <option key={value} value={value}>
                    {capitalise(value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Muscle group
              <select
                value={editing.draft.muscleGroup ?? ''}
                onChange={(e) => setDraft({ muscleGroup: (e.target.value || null) as MuscleGroup | null })}
              >
                <option value="">None</option>
                {MUSCLE_GROUPS.map((value) => (
                  <option key={value} value={value}>
                    {capitalise(value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <textarea rows={3} value={editing.draft.notes} onChange={(e) => setDraft({ notes: e.target.value })} />
            </label>
            {formError && <p role="alert" className="error">{formError}</p>}
            <button type="submit" className="primary" disabled={!editing.draft.name.trim()}>
              Save
            </button>
            {editing.mode === 'edit' &&
              (editing.confirmDelete ? (
                <>
                  <p>Delete “{displayName(editing.draft)}”? If it’s used in a workout or template it will be archived instead.</p>
                  <button type="button" className="danger" onClick={remove}>
                    Yes, delete
                  </button>
                </>
              ) : (
                <button type="button" className="danger" onClick={() => setEditing({ ...editing, confirmDelete: true })}>
                  Delete exercise
                </button>
              ))}
          </form>
        )}
      </Sheet>
    </main>
  )
}
