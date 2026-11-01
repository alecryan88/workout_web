import { monthDay } from './dates'
import type { LastPerformance, PerformedSet } from './store/types'

const performed = (s: PerformedSet) => `${s.reps}${s.weight === null ? '' : ` @ ${s.weight}`}`

export function summarisePerformance(last: LastPerformance): string {
  const sets = last.sets
  const sameWeight = sets.every((s) => s.weight === sets[0].weight)
  const sameReps = sets.every((s) => s.reps === sets[0].reps)
  const weight = sets[0].weight === null ? '' : ` @ ${sets[0].weight}`
  let body: string
  if (sameWeight && sameReps) body = `${sets.length}×${sets[0].reps}${weight}`
  else if (sameWeight) body = `${sets.map((s) => s.reps).join(', ')}${weight}`
  else body = sets.map(performed).join(', ')
  return `Last: ${body} on ${monthDay(last.date)}`
}
