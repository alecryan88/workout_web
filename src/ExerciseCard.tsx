import { useEffect, useId, useState } from 'react'
import NumberInput from './NumberInput'
import { useStore } from './store/context'
import type { SetEntry, WorkoutExercise } from './store/types'
import { summarisePerformance } from './summary'

type Props = {
  entry: WorkoutExercise
  workoutDate: string
  isFirst: boolean
  isLast: boolean
  expanded: boolean
  onToggle: () => void
  onChange: (entry: WorkoutExercise) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export const isLogged = (set: SetEntry) => set.actualReps !== null || set.actualWeight !== null

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

export default function ExerciseCard({ entry, workoutDate, isFirst, isLast, expanded, onToggle, onChange, onRemove, onMove }: Props) {
  const name = entry.exercise.name
  const lastLine = useLastPerformance(entry.exercise.id, workoutDate)
  const bodyId = useId()
  const summaryId = useId()
  const loggedCount = entry.sets.filter(isLogged).length
  const allLogged = entry.sets.length > 0 && loggedCount === entry.sets.length

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
        <h3>
          <button
            type="button"
            className="exercise-toggle"
            aria-expanded={expanded}
            aria-controls={expanded ? bodyId : undefined}
            aria-describedby={summaryId}
            onClick={onToggle}
          >
            {name}
          </button>
        </h3>
        <p id={summaryId} className="exercise-summary">
          {allLogged ? (
            <span className="exercise-done">
              <span aria-hidden="true">✓</span>
              <span className="visually-hidden">All sets logged</span>
            </span>
          ) : (
            <span className="exercise-progress">{`${loggedCount}/${entry.sets.length} sets`}</span>
          )}
          {lastLine && <span className="last">{lastLine}</span>}
        </p>
        <span className={`chevron${expanded ? ' open' : ''}`} aria-hidden="true">
          ›
        </span>
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

      {expanded && (
        <div id={bodyId} className="exercise-body">
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
        </div>
      )}
    </section>
  )
}
