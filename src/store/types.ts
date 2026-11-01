export type WorkoutStatus = 'planned' | 'done'

export type SetEntry = {
  targetReps: number | null
  targetWeight: number | null
  actualReps: number | null
  actualWeight: number | null
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
  loggedSetCount: number
}

export const isLogged = (set: Pick<SetEntry, 'actualReps' | 'actualWeight'>) =>
  set.actualReps !== null || set.actualWeight !== null

export type PerformedSet = {
  reps: number | null
  weight: number | null
}

export type LastPerformance = {
  date: string
  sets: PerformedSet[]
}

export type CopyOptions = {
  actualsAsTargets: boolean
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
