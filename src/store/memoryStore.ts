import { copyExercises } from './copy'
import { summaryCounts, type Exercise, type Store, type Workout } from './types'

type Options = {
  email: string
  password: string
  signedIn?: boolean
}

export function createMemoryStore({ email, password, signedIn = false }: Options): Store {
  let session = signedIn
  let nextId = 1
  const workouts = new Map<string, Workout>()
  const exercises: Exercise[] = []

  const id = () => String(nextId++)

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
      return workout ? structuredClone(workout) : null
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
    async copyWorkout(workoutId, dates, { actualsAsTargets }) {
      const source = workouts.get(workoutId)
      if (!source) throw new Error('Workout not found')
      for (const date of dates) {
        const copy: Workout = {
          ...structuredClone(source),
          id: id(),
          date,
          status: 'planned',
          exercises: copyExercises(source, actualsAsTargets),
        }
        workouts.set(copy.id, copy)
      }
    },
    async searchExercises(prefix) {
      const needle = prefix.trim().toLowerCase()
      if (!needle) return []
      return exercises
        .filter((e) => e.name.toLowerCase().startsWith(needle))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({ ...e }))
    },
    async findOrCreateExercise(name) {
      const trimmed = name.trim()
      const existing = exercises.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
      if (existing) return { ...existing }
      const exercise = { id: id(), name: trimmed }
      exercises.push(exercise)
      return { ...exercise }
    },
    async lastPerformance(exerciseId, beforeDate) {
      const candidates = [...workouts.values()]
        .filter((w) => w.status === 'done' && w.date < beforeDate)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      for (const workout of candidates) {
        const sets = workout.exercises
          .filter((e) => e.exercise.id === exerciseId)
          .flatMap((e) => e.sets)
          .filter((s) => s.actualReps !== null)
          .map((s) => ({ reps: s.actualReps, weight: s.actualWeight }))
        if (sets.length > 0) return { date: workout.date, sets }
      }
      return null
    },
  }
}
