import type { Workout, WorkoutExercise } from './types'

export function copyExercises(source: Workout, tickedOnly: boolean): WorkoutExercise[] {
  return source.exercises.map((entry) => ({
    exercise: { ...entry.exercise },
    restSeconds: entry.restSeconds,
    sets: entry.sets
      .filter((set) => !tickedOnly || set.completed)
      .map((set) => ({ weight: set.weight, reps: set.reps, completed: false })),
  }))
}
