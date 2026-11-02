import { useEffect, useState } from 'react'
import NumberInput from './NumberInput'
import Sheet from './Sheet'
import { useStore } from './store/context'
import type { SetEntry, WorkoutExercise } from './store/types'
import { summarisePerformance } from './summary'

type Props = {
  entry: WorkoutExercise
  workoutDate: string
  isFirst: boolean
  isLast: boolean
  onChange: (entry: WorkoutExercise) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

const emptySet: SetEntry = { weight: null, reps: null, completed: false }

function useLastPerformance(exerciseId: string, beforeDate: string) {
  const store = useStore()
  const [line, setLine] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    store
      .lastPerformance(exerciseId, beforeDate)
      .then((last) => !cancelled && setLine(last ? summarisePerformance(last) : null))
      .catch(() => !cancelled && setLine(null))
    return () => {
      cancelled = true
    }
  }, [store, exerciseId, beforeDate])
  return line
}

export default function ExerciseCard({ entry, workoutDate, isFirst, isLast, onChange, onRemove, onMove }: Props) {
  const name = entry.exercise.name
  const lastLine = useLastPerformance(entry.exercise.id, workoutDate)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingSets, setEditingSets] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const fromMenu = (action: () => void) => () => {
    closeMenu()
    action()
  }

  const setSets = (sets: SetEntry[]) => onChange({ ...entry, sets })

  const updateSet = (index: number, changes: Partial<SetEntry>) =>
    setSets(entry.sets.map((s, i) => (i === index ? { ...s, ...changes } : s)))

  const addSet = () => {
    const previous = entry.sets[entry.sets.length - 1]
    setSets([...entry.sets, previous ? { ...emptySet, weight: previous.weight, reps: previous.reps } : emptySet])
  }

  const rowClass = (set: SetEntry) => ['set-row', set.completed && 'completed', editingSets && 'editing'].filter(Boolean).join(' ')

  return (
    <section className="exercise-card" aria-label={name}>
      <div className="exercise-header">
        <h3>{name}</h3>
        <div className="exercise-tools">
          {editingSets ? (
            <button type="button" className="link-button" onClick={() => setEditingSets(false)}>
              Done
            </button>
          ) : (
            <button type="button" className="chip" aria-label={`Actions for ${name}`} onClick={() => setMenuOpen(true)}>
              •••
            </button>
          )}
        </div>
      </div>
      {lastLine && <p className="last">{lastLine}</p>}

      {entry.sets.length > 0 && (
        <div className="sets">
          <div className={`set-row set-head${editingSets ? ' editing' : ''}`} aria-hidden="true">
            <span>Set</span>
            <span>lbs</span>
            <span>Reps</span>
            <span>✓</span>
            {editingSets && <span />}
          </div>
          {entry.sets.map((set, i) => {
            const label = `${name} set ${i + 1}`
            return (
              <div role="group" aria-label={label} className={rowClass(set)} key={i}>
                <span className="set-number">{i + 1}</span>
                <NumberInput label={`${label} lbs`} decimal value={set.weight} onChange={(v) => updateSet(i, { weight: v })} />
                <NumberInput label={`${label} reps`} value={set.reps} onChange={(v) => updateSet(i, { reps: v })} />
                <button
                  type="button"
                  className="tick"
                  aria-label={`Complete ${label}`}
                  aria-pressed={set.completed}
                  onClick={() => updateSet(i, { completed: !set.completed })}
                >
                  ✓
                </button>
                {editingSets && (
                  <button type="button" className="icon danger" aria-label={`Remove ${label}`} onClick={() => setSets(entry.sets.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button type="button" className="add-set" aria-label={`Add set to ${name}`} onClick={addSet}>
        + Add Set
      </button>

      <Sheet open={menuOpen} title={name} onClose={closeMenu}>
        <button type="button" aria-label={`Move ${name} up`} disabled={isFirst} onClick={fromMenu(() => onMove(-1))}>
          Move up
        </button>
        <button type="button" aria-label={`Move ${name} down`} disabled={isLast} onClick={fromMenu(() => onMove(1))}>
          Move down
        </button>
        <button type="button" onClick={fromMenu(() => setEditingSets(true))}>
          Edit sets
        </button>
        <button type="button" className="danger" aria-label={`Remove ${name}`} onClick={fromMenu(onRemove)}>
          Remove exercise
        </button>
      </Sheet>
    </section>
  )
}
