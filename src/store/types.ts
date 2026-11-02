export type WorkoutStatus = 'planned' | 'done'

/** A planned lbs × reps pair, as held by a template. */
export type PlannedSet = {
  weight: number | null
  reps: number | null
}

export type SetEntry = PlannedSet & {
  completed: boolean
}

export const DEFAULT_REST_SECONDS = 120

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full body'] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export type Exercise = {
  id: string
  name: string
  equipment: Equipment
  muscleGroup: MuscleGroup | null
  notes: string
}

export type ExerciseInput = Omit<Exercise, 'id'>

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** "Name (Equipment)", leaving out the equipment when it is "other". */
export const displayName = ({ name, equipment }: Pick<Exercise, 'name' | 'equipment'>) =>
  equipment === 'other' ? name : `${name} (${capitalise(equipment)})`

export class DuplicateExerciseError extends Error {
  constructor() {
    super('An exercise with that name and equipment already exists.')
  }
}

export type WorkoutExercise = {
  exercise: Exercise
  restSeconds: number
  sets: SetEntry[]
}

export type TemplateExercise = {
  exercise: Exercise
  restSeconds: number
  sets: PlannedSet[]
}

export type Template = {
  /** null for a template that hasn't been saved yet. */
  id: string | null
  name: string
  notes: string
  exercises: TemplateExercise[]
}

export type TemplateSummary = {
  id: string
  name: string
  exerciseCount: number
}

export type Workout = {
  id: string
  date: string
  name: string
  notes: string
  status: WorkoutStatus
  /** The template this workout was scheduled from, for reference only (no live sync). */
  templateId: string | null
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

/** Previous values for one exercise: `sets[i]` is set number i + 1, or null when that set wasn't completed. */
export type LastPerformance = {
  date: string
  sets: (PerformedSet | null)[]
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
  /** Active exercises whose name starts with the prefix, ordered by name then equipment. */
  searchExercises(prefix: string): Promise<Exercise[]>
  /** Inline creation from the picker: finds or creates the exercise with this name and equipment "other". */
  findOrCreateExercise(name: string): Promise<Exercise>
  /** Active (not archived) exercises, ordered by name then equipment. */
  listExercises(): Promise<Exercise[]>
  /** Throws DuplicateExerciseError when name + equipment is taken. */
  createExercise(input: ExerciseInput): Promise<Exercise>
  /** Throws DuplicateExerciseError when name + equipment is taken. */
  updateExercise(exercise: Exercise): Promise<void>
  /** Removes an unused exercise, or archives one used by a workout or template. */
  deleteExercise(id: string): Promise<'deleted' | 'archived'>
  listTemplates(): Promise<TemplateSummary[]>
  getTemplate(id: string): Promise<Template | null>
  /** Creates the template when its id is null, otherwise replaces it. Returns its id. */
  saveTemplate(template: Template): Promise<string>
  /** Deletes the template. Workouts scheduled from it are left alone. */
  deleteTemplate(id: string): Promise<void>
  /** Creates one planned, unticked snapshot workout per date from the template. Returns the new workout ids in date order. */
  scheduleTemplate(templateId: string, dates: string[]): Promise<string[]>
  /** Creates a template from a workout's name, notes, exercises, set values and rest times. Returns its id. */
  createTemplateFromWorkout(workoutId: string): Promise<string>
  lastPerformance(exerciseId: string, beforeDate: string): Promise<LastPerformance | null>
}
