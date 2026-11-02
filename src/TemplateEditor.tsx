import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDays, today } from './dates'
import ExerciseBlock from './ExerciseBlock'
import ExercisePicker from './ExercisePicker'
import { moveItem, removeItem, replaceItem } from './listOps'
import Sheet from './Sheet'
import { useStore } from './store/context'
import { DEFAULT_REST_SECONDS, type PlannedSet, type Template, type TemplateExercise } from './store/types'

type EditorSheet = 'none' | 'actions' | 'details' | 'delete' | 'discard'

const blankTemplate = (): Template => ({ id: null, name: 'New Template', notes: '', exercises: [] })

const asPlanned = ({ weight, reps }: PlannedSet): PlannedSet => ({ weight, reps })

export default function TemplateEditor() {
  const { id = 'new' } = useParams()
  const store = useStore()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Template | null>(null)
  const [saved, setSaved] = useState<string>('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<EditorSheet>('none')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const load = id === 'new' ? Promise.resolve(blankTemplate()) : store.getTemplate(id)
    load
      .then((template) => {
        if (!template) return setLoadError('Template not found.')
        setDraft(template)
        setSaved(JSON.stringify(template))
      })
      .catch(() => setLoadError('Could not load template. Check your connection.'))
  }, [store, id])

  const backToList = () => navigate('/templates')

  if (loadError) {
    return (
      <main>
        <p role="alert" className="error">{loadError}</p>
        <button type="button" onClick={backToList}>Back to templates</button>
      </main>
    )
  }

  if (!draft) return null

  const dirty = JSON.stringify(draft) !== saved
  const update = (changes: Partial<Template>) => setDraft({ ...draft, ...changes })
  const setExercises = (exercises: TemplateExercise[]) => update({ exercises })
  const closeSheet = () => setSheet('none')

  const close = () => (dirty ? setSheet('discard') : backToList())

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await store.saveTemplate(draft)
      backToList()
    } catch {
      setError('Couldn’t save. Check your connection.')
      setBusy(false)
    }
  }

  const remove = async () => {
    try {
      if (draft.id !== null) await store.deleteTemplate(draft.id)
      backToList()
    } catch {
      closeSheet()
      setError('Could not delete. Check your connection.')
    }
  }

  return (
    <main className="editor">
      <header className="editor-header">
        <button type="button" className="chip close" aria-label="Close" onClick={close}>
          ✕
        </button>
        <div className="nav-title">
          <span className="nav-title-text">{draft.name}</span>
        </div>
        <button type="button" className="primary save" onClick={save} disabled={busy}>
          Save
        </button>
      </header>

      <div className="title-row">
        <h1>{draft.name}</h1>
        <button type="button" className="chip" aria-label="Template actions" onClick={() => setSheet('actions')}>
          •••
        </button>
      </div>
      {draft.notes && <p className="workout-notes">{draft.notes}</p>}
      {error && <p role="alert" className="error">{error}</p>}

      {draft.exercises.map((entry, i) => (
        <ExerciseBlock
          key={i}
          entry={entry}
          previousBefore={addDays(today(), 1)}
          tickable={false}
          makeSet={asPlanned}
          isFirst={i === 0}
          isLast={i === draft.exercises.length - 1}
          onChange={(changed) => setExercises(replaceItem(draft.exercises, i, changed))}
          onRemove={() => setExercises(removeItem(draft.exercises, i))}
          onMove={(direction) => setExercises(moveItem(draft.exercises, i, direction))}
        />
      ))}

      <ExercisePicker onPick={(exercise) => setExercises([...draft.exercises, { exercise, restSeconds: DEFAULT_REST_SECONDS, sets: [] }])} />

      <Sheet open={sheet === 'actions'} title="Template actions" onClose={closeSheet}>
        <button type="button" onClick={() => setSheet('details')}>
          Edit name & notes
        </button>
        <button type="button" className="danger" onClick={() => setSheet('delete')}>
          Delete
        </button>
      </Sheet>

      <Sheet open={sheet === 'details'} title="Edit name & notes" onClose={closeSheet} cancelLabel="Done">
        <label>
          Template name
          <input value={draft.name} onChange={(e) => update({ name: e.target.value })} />
        </label>
        <label>
          Notes
          <textarea rows={3} value={draft.notes} onChange={(e) => update({ notes: e.target.value })} />
        </label>
      </Sheet>

      <Sheet open={sheet === 'delete'} title="Delete template" onClose={closeSheet}>
        <p>Delete “{draft.name}”? Workouts already scheduled from it are kept.</p>
        <button type="button" className="danger" onClick={remove}>
          Yes, delete
        </button>
      </Sheet>

      <Sheet open={sheet === 'discard'} title="Discard changes?" onClose={closeSheet} cancelLabel="Keep editing">
        <p>Your changes to “{draft.name}” haven’t been saved.</p>
        <button type="button" className="danger" onClick={backToList}>
          Discard
        </button>
      </Sheet>
    </main>
  )
}
