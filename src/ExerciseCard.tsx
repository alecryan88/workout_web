import { useEffect, useState } from 'react'
import NumberInput from './NumberInput'
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

const emptySet: SetEntry = { targetReps: null, targetWeight: null, actualReps: null, actualWeight: null }

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

  const setSets = (sets: SetEntry[]) => onChange({ ...entry, sets })

  const updateSet = (index: number, changes: Partial<SetEntry>) =>
    setSets(entry.sets.map((s, i) => (i === index ? { ...s, ...changes } : s)))

  const addSet = () => {
    const previous = entry.sets[entry.sets.length - 1]
    setSets([
      ...entry.sets,
      previous ? { ...emptySet, targetReps: previous.targetReps, targetWeight: previous.targetWeight } : emptySet,
    ])
  }

  return (
    <section className="exercise-card" aria-label={name}>
      <div className="exercise-header">
        <h3>{name}</h3>
        <div className="exercise-tools">
          <button type="button" className="icon" aria-label={`Move ${name} up`} disabled={isFirst} onClick={() => onMove(-1)}>
            ↑
          </button>
          <button type="button" className="icon" aria-label={`Move ${name} down`} disabled={isLast} onClick={() => onMove(1)}>
            ↓
          </button>
          <button type="button" className="icon danger" aria-label={`Remove ${name}`} onClick={onRemove}>
            ✕
          </button>
        </div>
      </div>
      {lastLine && <p className="last">{lastLine}</p>}

      {entry.sets.length > 0 && (
        <div className="sets">
          <div className="set-row set-head" aria-hidden="true">
            <span>#</span>
            <span>Target</span>
            <span>Actual</span>
            <span />
            <span />
          </div>
          {entry.sets.map((set, i) => {
            const label = `${name} set ${i + 1}`
            return (
              <div className="set-row" key={i}>
                <span className="set-number">{i + 1}</span>
                <span className="pair">
                  <NumberInput label={`${label} target reps`} placeholder="reps" value={set.targetReps} onChange={(v) => updateSet(i, { targetReps: v })} />
                  <span className="times">×</span>
                  <NumberInput label={`${label} target weight`} placeholder="lbs" decimal value={set.targetWeight} onChange={(v) => updateSet(i, { targetWeight: v })} />
                </span>
                <span className="pair">
                  <NumberInput label={`${label} actual reps`} placeholder="reps" value={set.actualReps} onChange={(v) => updateSet(i, { actualReps: v })} />
                  <span className="times">×</span>
                  <NumberInput label={`${label} actual weight`} placeholder="lbs" decimal value={set.actualWeight} onChange={(v) => updateSet(i, { actualWeight: v })} />
                </span>
                <button
                  type="button"
                  className="icon hit"
                  aria-label={`${label} hit target`}
                  disabled={set.targetReps === null && set.targetWeight === null}
                  onClick={() => updateSet(i, { actualReps: set.targetReps, actualWeight: set.targetWeight })}
                >
                  ✓
                </button>
                <button type="button" className="icon danger" aria-label={`Remove ${label}`} onClick={() => setSets(entry.sets.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      <button type="button" className="add-set" aria-label={`Add set to ${name}`} onClick={addSet}>
        + Add set
      </button>
    </section>
  )
}
