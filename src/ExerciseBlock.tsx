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
  /** A running rest countdown in the divider below this set, if any. */
  countdown?: { setIndex: number; remainingSeconds: number } | null
  /** Called when a set is ticked (not when unticked). */
  onSetCompleted?: (setIndex: number) => void
}

const REST_STEP = 15
const MAX_REST = 600

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
  countdown = null,
  onSetCompleted,
}: Props<S>) {
  const name = displayName(entry.exercise)
  const weightLabel = entry.exercise.equipment === 'bodyweight' ? '+lbs' : 'lbs'
  const last = useLastPerformance(entry.exercise.id, previousBefore)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingSets, setEditingSets] = useState(false)
  const [restOpen, setRestOpen] = useState(false)
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

  const adjustRest = (delta: number) =>
    onChange({ ...entry, restSeconds: Math.min(MAX_REST, Math.max(0, entry.restSeconds + delta)) })

  const toggle = (index: number) => {
    const completed = !entry.sets[index].completed
    updateSet(index, { completed } as Partial<S>)
    if (completed) onSetCompleted?.(index)
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
                      onClick={() => toggle(i)}
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
                <div className="rest-divider" data-testid={`rest after ${label}`}>
                  {countdown?.setIndex === i ? (
                    <span className="rest-running" role="timer" aria-label="Rest remaining">
                      {minutesSeconds(countdown.remainingSeconds)}
                    </span>
                  ) : (
                    <button type="button" aria-label={`Rest time for ${name}: ${rest}`} onClick={() => setRestOpen(true)}>
                      {rest}
                    </button>
                  )}
                </div>
              </Fragment>
            )
          })}
        </div>
      )}

      <button type="button" className="add-set" aria-label={`Add set to ${name}`} onClick={addSet}>
        + Add Set ({rest})
      </button>

      <Sheet open={restOpen} title="Rest time" onClose={() => setRestOpen(false)} cancelLabel="Done">
        <p className="rest-sheet-name">{name}</p>
        <div className="stepper">
          <button type="button" onClick={() => adjustRest(-REST_STEP)} disabled={entry.restSeconds <= 0}>
            −15s
          </button>
          <span className="stepper-value">{rest}</span>
          <button type="button" onClick={() => adjustRest(REST_STEP)} disabled={entry.restSeconds >= MAX_REST}>
            +15s
          </button>
        </div>
      </Sheet>

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
