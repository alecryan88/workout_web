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

export type App = Awaited<ReturnType<typeof renderApp>>

type SeedSet = { weight: number | null; reps: number | null; completed: boolean }

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
      restSeconds: 120,
      sets: sets.map((s) => ({ ...s })),
    })
  }
  await store.saveWorkout({ ...workout, notes: seed.notes ?? '', exercises })
  if (seed.status === 'done') await store.setStatus(id, 'done')
  return id
}

/** A completed (ticked) set. */
export const did = (reps: number | null, weight: number | null = null): SeedSet => ({ reps, weight, completed: true })
/** An unticked set holding planned values. */
export const plan = (reps: number | null, weight: number | null = null): SeedSet => ({ reps, weight, completed: false })

export async function openWorkoutSheet(app: App, item: 'Edit details' | 'Copy' | 'Delete' | 'Save as template' | 'Mark not done') {
  await app.user.click(app.screen.getByRole('button', { name: 'Workout actions' }))
  await app.user.click(app.screen.getByRole('button', { name: item }))
}

export async function addExercise(app: App, name: string) {
  await app.user.click(await app.screen.findByRole('button', { name: '+ Add exercise' }))
  await app.user.type(app.screen.getByLabelText('Add exercise'), `${name}{Enter}`)
}

export async function exerciseAction(app: App, exercise: string, action: string) {
  await app.user.click(app.screen.getByRole('button', { name: `Actions for ${exercise}` }))
  await app.user.click(app.screen.getByRole('button', { name: action }))
}
