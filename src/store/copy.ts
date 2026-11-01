import type { Workout, WorkoutExercise } from './types'

export function copyExercises(source: Workout, actualsAsTargets: boolean): WorkoutExercise[] {
  return source.exercises.map((entry) => ({
    exercise: { ...entry.exercise },
    sets: entry.sets.map((set) => {
      const promote = actualsAsTargets && set.actualReps !== null
      return {
        targetReps: promote ? set.actualReps : set.targetReps,
        targetWeight: promote ? set.actualWeight : set.targetWeight,
        actualReps: null,
        actualWeight: null,
      }
    }),
  }))
}
