import { createClient } from '@supabase/supabase-js'
import type { Exercise, LastPerformance, Store, Workout, WorkoutStatus, WorkoutSummary } from './types'

type SetRow = {
  position: number
  target_reps: number | null
  target_weight: number | null
  actual_reps: number | null
  actual_weight: number | null
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
      return check<WorkoutSummary[]>(
        await supabase
          .from('workouts')
          .select('id, date, name, status')
          .gte('date', fromDate)
          .lte('date', toDate)
          .order('date')
          .order('created_at'),
      )
    },
    async getWorkout(id) {
      const row = check<WorkoutRow | null>(
        await supabase
          .from('workouts')
          .select(
            'id, date, name, notes, status, workout_exercises(position, exercise:exercises(id, name), sets(position, target_reps, target_weight, actual_reps, actual_weight))',
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
            targetReps: s.target_reps,
            targetWeight: num(s.target_weight),
            actualReps: s.actual_reps,
            actualWeight: num(s.actual_weight),
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
              sets: e.sets.map((s) => ({
                target_reps: s.targetReps,
                target_weight: s.targetWeight,
                actual_reps: s.actualReps,
                actual_weight: s.actualWeight,
              })),
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
    async copyWorkout(id, dates, { actualsAsTargets }) {
      check(await supabase.rpc('copy_workout', { source_id: id, dates, actuals_as_targets: actualsAsTargets }))
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
      return { date: result.date, sets: result.sets.map((s) => ({ reps: s.reps, weight: num(s.weight) })) }
    },
  }
}
