import { Fragment, useEffect, useState } from 'react'
import NumberInput from './NumberInput'
import Sheet from './Sheet'
import { formatPrevious } from './previous'
import { useStore } from './store/context'
import { displayName, type Exercise, type LastPerformance, type PerformedSet, type PlannedSet } from './store/types'
import { minutesSeconds } from './time'

/** A set as the block sees it: workout sets carry `completed`, template sets don't. */
type BlockSet = PlannedSet & { completed?: boolean }

export type BlockEntry<S extends BlockSet> = {
  exercise: Exercise
  restSeconds: number
  sets: S[]
}

type Props<S extends BlockSet> = {
  entry: BlockEntry<S>
  /** Previous comes from the most recent done workout before this date. */
  previousBefore: string
  /** Shows the ✓ column (workouts). Templates leave it off. */
  tickable: boolean
  /** Builds a new set from the values to start it with. */
  makeSet: (values: PlannedSet) => S
  isFirst: boolean
  isLast: boolean
  onChange: (entry: BlockEntry<S>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

function useLastPerformance(exerciseId: string, beforeDate: string) {
  const store = useStore()
  const [last, setLast] = useState<LastPerformance | null>(null)
  useEffect(() => {
    let cancelled = false
    store
      .lastPerformance(exerciseId, beforeDate)
      .then((result) => !cancelled && setLast(result))
      .catch(() => !cancelled && setLast(null))
    return () => {
      cancelled = true
    }
  }, [store, exerciseId, beforeDate])
  return last
}

const hasValue = (set: PerformedSet | null | undefined): set is PerformedSet =>
  !!set && (set.weight !== null || set.reps !== null)

/** One exercise in the workout screen or template editor: header, menu, set table, rest dividers and add set. */
export default function ExerciseBlock<S extends BlockSet>({
  entry,
  previousBefore,
  tickable,
  makeSet,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: Props<S>) {
  const name = displayName(entry.exercise)
  const weightLabel = entry.exercise.equipment === 'bodyweight' ? '+lbs' : 'lbs'
  const last = useLastPerformance(entry.exercise.id, previousBefore)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingSets, setEditingSets] = useState(false)
  const rest = minutesSeconds(entry.restSeconds)

  const closeMenu = () => setMenuOpen(false)
  const fromMenu = (action: () => void) => () => {
    closeMenu()
    action()
  }

  const setSets = (sets: S[]) => onChange({ ...entry, sets })

  const updateSet = (index: number, changes: Partial<S>) =>
    setSets(entry.sets.map((s, i) => (i === index ? { ...s, ...changes } : s)))

  const addSet = () => {
    const previous = entry.sets[entry.sets.length - 1]
    setSets([...entry.sets, makeSet({ weight: previous?.weight ?? null, reps: previous?.reps ?? null })])
  }

  const columns = ['set-row', !tickable && 'no-tick', editingSets && 'editing']

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

      {entry.sets.length > 0 && (
        <div className="sets">
          <div className={[...columns, 'set-head'].filter(Boolean).join(' ')} aria-hidden="true">
            <span>Set</span>
            <span>Previous</span>
            <span>{weightLabel}</span>
            <span>Reps</span>
            {tickable && <span>✓</span>}
            {editingSets && <span />}
          </div>
          {entry.sets.map((set, i) => {
            const label = `${name} set ${i + 1}`
            const prev = last?.sets[i]
            return (
              <Fragment key={i}>
                <div role="group" aria-label={label} className={[...columns, set.completed && 'completed'].filter(Boolean).join(' ')}>
                  <span className="set-number">{i + 1}</span>
                  {hasValue(prev) ? (
                    <button
                      type="button"
                      className="previous"
                      data-testid={`previous ${label}`}
                      aria-label={`Use previous for ${label}`}
                      onClick={() => updateSet(i, { weight: prev.weight, reps: prev.reps } as Partial<S>)}
                    >
                      {formatPrevious(prev)}
                    </button>
                  ) : (
                    <span className="previous" data-testid={`previous ${label}`}>
                      —
                    </span>
                  )}
                  <NumberInput label={`${label} lbs`} decimal value={set.weight} onChange={(v) => updateSet(i, { weight: v } as Partial<S>)} />
                  <NumberInput label={`${label} reps`} value={set.reps} onChange={(v) => updateSet(i, { reps: v } as Partial<S>)} />
                  {tickable && (
                    <button
                      type="button"
                      className="tick"
                      aria-label={`Complete ${label}`}
                      aria-pressed={!!set.completed}
                      onClick={() => updateSet(i, { completed: !set.completed } as Partial<S>)}
                    >
                      ✓
                    </button>
                  )}
                  {editingSets && (
                    <button type="button" className="icon danger" aria-label={`Remove ${label}`} onClick={() => setSets(entry.sets.filter((_, j) => j !== i))}>
                      ✕
                    </button>
                  )}
                </div>
                <div className="rest-divider" aria-hidden="true">
                  <span>{rest}</span>
                </div>
              </Fragment>
            )
          })}
        </div>
      )}

      <button type="button" className="add-set" aria-label={`Add set to ${name}`} onClick={addSet}>
        + Add Set ({rest})
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
