export type WorkoutStatus = 'planned' | 'done'

export type SetEntry = {
  weight: number | null
  reps: number | null
  completed: boolean
}

export type Exercise = {
  id: string
  name: string
}

export type WorkoutExercise = {
  exercise: Exercise
  sets: SetEntry[]
}

export type Workout = {
  id: string
  date: string
  name: string
  notes: string
  status: WorkoutStatus
  exercises: WorkoutExercise[]
}

export type WorkoutSummary = Pick<Workout, 'id' | 'date' | 'name' | 'status'> & {
  exerciseCount: number
  setCount: number
  completedSetCount: number
}

export function summaryCounts(exercises: { sets: Pick<SetEntry, 'completed'>[] }[]) {
  const sets = exercises.flatMap((e) => e.sets)
  return {
    exerciseCount: exercises.length,
    setCount: sets.length,
    completedSetCount: sets.filter((s) => s.completed).length,
  }
}

export const isMissed = (workout: Pick<Workout, 'status' | 'date'>, today: string) =>
  workout.status === 'planned' && workout.date < today

export type PerformedSet = {
  reps: number | null
  weight: number | null
}

export type LastPerformance = {
  date: string
  sets: PerformedSet[]
}

export type CopyOptions = {
  /** Copy only the ticked sets (with their values) instead of every set. */
  tickedOnly: boolean
}

export interface Store {
  hasSession(): Promise<boolean>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  listWorkouts(fromDate: string, toDate: string): Promise<WorkoutSummary[]>
  getWorkout(id: string): Promise<Workout | null>
  createWorkout(date: string, name: string): Promise<string>
  saveWorkout(workout: Workout): Promise<void>
  deleteWorkout(id: string): Promise<void>
  setStatus(id: string, status: WorkoutStatus): Promise<void>
  copyWorkout(id: string, dates: string[], options: CopyOptions): Promise<void>
  searchExercises(prefix: string): Promise<Exercise[]>
  findOrCreateExercise(name: string): Promise<Exercise>
  lastPerformance(exerciseId: string, beforeDate: string): Promise<LastPerformance | null>
}
