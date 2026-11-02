import type { PerformedSet } from './store/types'

export function formatPrevious({ weight, reps }: PerformedSet): string {
  if (weight !== null && reps !== null) return `${weight} lb × ${reps}`
  if (weight !== null) return `${weight} lb`
  if (reps !== null) return `${reps} reps`
  return '—'
}
