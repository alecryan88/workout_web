import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../App'
import { createMemoryStore } from '../store/memoryStore'
import type { Store } from '../store/types'

export const EMAIL = 'me@example.com'
export const PASSWORD = 'correct-horse'

export function setToday(isoDate: string) {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(`${isoDate}T10:00:00`))
}

export function newStore(signedIn = true) {
  return createMemoryStore({ email: EMAIL, password: PASSWORD, signedIn })
}

export async function renderApp(store: Store) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<App store={store} />)
  return { user, screen }
}

type SeedSet = { target?: [number | null, number | null]; actual?: [number | null, number | null] }

type SeedWorkout = {
  date: string
  name: string
  status?: 'planned' | 'done'
  notes?: string
  exercises?: Record<string, SeedSet[]>
}

export async function seedWorkout(store: Store, seed: SeedWorkout) {
  const id = await store.createWorkout(seed.date, seed.name)
  const workout = (await store.getWorkout(id))!
  const exercises = []
  for (const [name, sets] of Object.entries(seed.exercises ?? {})) {
    exercises.push({
      exercise: await store.findOrCreateExercise(name),
      sets: sets.map((s) => ({
        targetReps: s.target?.[0] ?? null,
        targetWeight: s.target?.[1] ?? null,
        actualReps: s.actual?.[0] ?? null,
        actualWeight: s.actual?.[1] ?? null,
      })),
    })
  }
  await store.saveWorkout({ ...workout, notes: seed.notes ?? '', status: seed.status ?? 'planned', exercises })
  return id
}

export const did = (reps: number | null, weight: number | null = null): SeedSet => ({ actual: [reps, weight] })
export const plan = (reps: number | null, weight: number | null = null): SeedSet => ({ target: [reps, weight] })

export async function openWorkoutSheet(app: Awaited<ReturnType<typeof renderApp>>, item: 'Edit details' | 'Copy' | 'Delete') {
  await app.user.click(app.screen.getByRole('button', { name: 'Workout actions' }))
  await app.user.click(app.screen.getByRole('button', { name: item }))
}
