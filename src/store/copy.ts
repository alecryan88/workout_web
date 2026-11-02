import type { Workout, WorkoutExercise } from './types'

export function copyExercises(source: Workout, tickedOnly: boolean): WorkoutExercise[] {
  return source.exercises.map((entry) => ({
    exercise: { ...entry.exercise },
    sets: entry.sets
      .filter((set) => !tickedOnly || set.completed)
      .map((set) => ({ weight: set.weight, reps: set.reps, completed: false })),
  }))
}
