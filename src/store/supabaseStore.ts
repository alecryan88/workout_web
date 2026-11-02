import { createClient } from '@supabase/supabase-js'
import { summaryCounts, type Exercise, type LastPerformance, type Store, type Workout, type WorkoutStatus, type WorkoutSummary } from './types'

type SetRow = {
  position: number
  weight: number | string | null
  reps: number | null
  completed: boolean
}

type WorkoutRow = {
  id: string
  date: string
  name: string
  notes: string | null
  status: WorkoutStatus
  workout_exercises: {
    position: number
    exercise: Exercise
    sets: SetRow[]
  }[]
}

type SummaryRow = {
  id: string
  date: string
  name: string
  status: WorkoutStatus
  workout_exercises: { sets: { completed: boolean }[] }[]
}

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position

const num = (value: number | string | null) => (value === null ? null : Number(value))

function check<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error
  return data as T
}

function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export function createSupabaseStore(url: string, key: string): Store {
  const supabase = createClient(url, key)

  return {
    async hasSession() {
      const { data } = await supabase.auth.getSession()
      return data.session !== null
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signOut() {
      await supabase.auth.signOut()
    },
    async listWorkouts(fromDate, toDate) {
      const rows = check<SummaryRow[]>(
        await supabase
          .from('workouts')
          .select('id, date, name, status, workout_exercises(sets(completed))')
          .gte('date', fromDate)
          .lte('date', toDate)
          .order('date')
          .order('created_at'),
      )
      return rows.map(
        ({ workout_exercises, ...workout }): WorkoutSummary => ({
          ...workout,
          ...summaryCounts(workout_exercises),
        }),
      )
    },
    async getWorkout(id) {
      const row = check<WorkoutRow | null>(
        await supabase
          .from('workouts')
          .select(
            'id, date, name, notes, status, workout_exercises(position, exercise:exercises(id, name), sets(position, weight, reps, completed))',
          )
          .eq('id', id)
          .maybeSingle<WorkoutRow>(),
      )
      if (!row) return null
      return {
        id: row.id,
        date: row.date,
        name: row.name,
        notes: row.notes ?? '',
        status: row.status,
        exercises: [...row.workout_exercises].sort(byPosition).map((we) => ({
          exercise: we.exercise,
          sets: [...we.sets].sort(byPosition).map((s) => ({
            weight: num(s.weight),
            reps: s.reps,
            completed: s.completed,
          })),
        })),
      }
    },
    async createWorkout(date, name) {
      const row = check<{ id: string }>(await supabase.from('workouts').insert({ date, name }).select('id').single())
      return row.id
    },
    async saveWorkout(workout: Workout) {
      check(
        await supabase.rpc('save_workout', {
          payload: {
            id: workout.id,
            date: workout.date,
            name: workout.name,
            notes: workout.notes,
            status: workout.status,
            exercises: workout.exercises.map((e) => ({
              exercise_id: e.exercise.id,
              sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps, completed: s.completed })),
            })),
          },
        }),
      )
    },
    async deleteWorkout(id) {
      check(await supabase.from('workouts').delete().eq('id', id))
    },
    async setStatus(id, status) {
      check(await supabase.from('workouts').update({ status, updated_at: new Date().toISOString() }).eq('id', id))
    },
    async copyWorkout(id, dates, { tickedOnly }) {
      check(await supabase.rpc('copy_workout', { source_id: id, dates, ticked_only: tickedOnly }))
    },
    async searchExercises(prefix) {
      const needle = prefix.trim()
      if (!needle) return []
      return check<Exercise[]>(
        await supabase.from('exercises').select('id, name').ilike('name', `${escapeLike(needle)}%`).order('name').limit(8),
      )
    },
    async findOrCreateExercise(name) {
      const row = check<Exercise>(await supabase.rpc('find_or_create_exercise', { p_name: name }).single<Exercise>())
      return { id: row.id, name: row.name }
    },
    async lastPerformance(exerciseId, beforeDate) {
      const result = check<LastPerformance | null>(
        await supabase.rpc('last_performance', { p_exercise_id: exerciseId, before_date: beforeDate }),
      )
      if (!result) return null
      return { date: result.date, sets: result.sets.map((s) => (s ? { reps: s.reps, weight: num(s.weight) } : null)) }
    },
  }
}
