import { copyExercises } from './copy'
import { DuplicateExerciseError, summaryCounts, type Exercise, type ExerciseInput, type Store, type Template, type Workout } from './types'

type Options = {
  email: string
  password: string
  signedIn?: boolean
}

export function createMemoryStore({ email, password, signedIn = false }: Options): Store {
  let session = signedIn
  let nextId = 1
  const workouts = new Map<string, Workout>()
  const exercises: (Exercise & { archived: boolean })[] = []
  const templates = new Map<string, Template & { id: string }>()

  const id = () => String(nextId++)

  const active = () => exercises.filter((e) => !e.archived)
  const byNameThenEquipment = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name) || a.equipment.localeCompare(b.equipment)
  const publicExercise = ({ archived: _, ...exercise }: Exercise & { archived: boolean }): Exercise => ({ ...exercise })
  const sameKey = (a: Pick<Exercise, 'name' | 'equipment'>, b: Pick<Exercise, 'name' | 'equipment'>) =>
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.equipment === b.equipment
  const assertUnique = (candidate: Pick<Exercise, 'name' | 'equipment'>, exceptId?: string) => {
    if (exercises.some((e) => e.id !== exceptId && sameKey(e, candidate))) throw new DuplicateExerciseError()
  }
  const isUsed = (exerciseId: string) =>
    [...workouts.values(), ...templates.values()].some((w) => w.exercises.some((e) => e.exercise.id === exerciseId))
  const current = (exercise: Exercise): Exercise => {
    const record = exercises.find((e) => e.id === exercise.id)
    return record ? publicExercise(record) : exercise
  }
  const withCurrentExercises = <T extends { exercises: { exercise: Exercise }[] }>(value: T): T => ({
    ...value,
    exercises: value.exercises.map((e) => ({ ...e, exercise: current(e.exercise) })),
  })

  return {
    async hasSession() {
      return session
    },
    async signIn(e, p) {
      if (e !== email || p !== password) throw new Error('Invalid email or password')
      session = true
    },
    async signOut() {
      session = false
    },
    async listWorkouts(fromDate, toDate) {
      return [...workouts.values()]
        .filter((w) => w.date >= fromDate && w.date <= toDate)
        .map(({ id, date, name, status, exercises }) => ({ id, date, name, status, ...summaryCounts(exercises) }))
    },
    async getWorkout(workoutId) {
      const workout = workouts.get(workoutId)
      if (!workout) return null
      return withCurrentExercises(structuredClone(workout))
    },
    async createWorkout(date, name) {
      const workout: Workout = { id: id(), date, name, notes: '', status: 'planned', exercises: [] }
      workouts.set(workout.id, workout)
      return workout.id
    },
    async saveWorkout(workout) {
      if (!workouts.has(workout.id)) throw new Error('Workout not found')
      workouts.set(workout.id, structuredClone(workout))
    },
    async deleteWorkout(workoutId) {
      workouts.delete(workoutId)
    },
    async setStatus(workoutId, status) {
      const workout = workouts.get(workoutId)
      if (workout) workout.status = status
    },
    async copyWorkout(workoutId, dates, { tickedOnly }) {
      const source = workouts.get(workoutId)
      if (!source) throw new Error('Workout not found')
      for (const date of dates) {
        const copy: Workout = {
          ...structuredClone(source),
          id: id(),
          date,
          status: 'planned',
          exercises: copyExercises(source, tickedOnly),
        }
        workouts.set(copy.id, copy)
      }
    },
    async searchExercises(prefix) {
      const needle = prefix.trim().toLowerCase()
      if (!needle) return []
      return active()
        .filter((e) => e.name.toLowerCase().startsWith(needle))
        .sort(byNameThenEquipment)
        .map(publicExercise)
    },
    async findOrCreateExercise(name) {
      const key = { name: name.trim(), equipment: 'other' as const }
      const existing = exercises.find((e) => sameKey(e, key))
      if (existing) {
        existing.archived = false
        return publicExercise(existing)
      }
      const exercise = { id: id(), ...key, muscleGroup: null, notes: '', archived: false }
      exercises.push(exercise)
      return publicExercise(exercise)
    },
    async listExercises() {
      return active().sort(byNameThenEquipment).map(publicExercise)
    },
    async createExercise(input: ExerciseInput) {
      assertUnique(input)
      const exercise = { ...input, name: input.name.trim(), id: id(), archived: false }
      exercises.push(exercise)
      return publicExercise(exercise)
    },
    async updateExercise(exercise) {
      assertUnique(exercise, exercise.id)
      const record = exercises.find((e) => e.id === exercise.id)
      if (!record) throw new Error('Exercise not found')
      Object.assign(record, { ...exercise, name: exercise.name.trim() })
    },
    async deleteExercise(exerciseId) {
      const index = exercises.findIndex((e) => e.id === exerciseId)
      if (index === -1) throw new Error('Exercise not found')
      if (isUsed(exerciseId)) {
        exercises[index].archived = true
        return 'archived'
      }
      exercises.splice(index, 1)
      return 'deleted'
    },
    async listTemplates() {
      return [...templates.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ id, name, exercises }) => ({ id, name, exerciseCount: exercises.length }))
    },
    async getTemplate(templateId) {
      const template = templates.get(templateId)
      return template ? withCurrentExercises(structuredClone(template)) : null
    },
    async saveTemplate(template) {
      if (template.id !== null && !templates.has(template.id)) throw new Error('Template not found')
      const saved = { ...structuredClone(template), id: template.id ?? id() }
      templates.set(saved.id, saved)
      return saved.id
    },
    async deleteTemplate(templateId) {
      templates.delete(templateId)
    },
    async createTemplateFromWorkout(workoutId) {
      const workout = workouts.get(workoutId)
      if (!workout) throw new Error('Workout not found')
      return this.saveTemplate({
        id: null,
        name: workout.name,
        notes: workout.notes,
        exercises: workout.exercises.map((e) => ({
          exercise: { ...e.exercise },
          restSeconds: e.restSeconds,
          sets: e.sets.map(({ weight, reps }) => ({ weight, reps })),
        })),
      })
    },
    async lastPerformance(exerciseId, beforeDate) {
      const candidates = [...workouts.values()]
        .filter((w) => w.status === 'done' && w.date < beforeDate)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      for (const workout of candidates) {
        const sets = workout.exercises.filter((e) => e.exercise.id === exerciseId).flatMap((e) => e.sets)
        if (sets.some((s) => s.completed)) {
          return { date: workout.date, sets: sets.map((s) => (s.completed ? { reps: s.reps, weight: s.weight } : null)) }
        }
      }
      return null
    },
  }
}
