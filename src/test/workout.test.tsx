import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, openWorkoutSheet, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

describe('creating and editing a workout', () => {
  it('adds a named workout with notes to a day', async () => {
    setToday('2026-11-04')
    const app = await renderApp(newStore())
    const { user, screen } = app

    await user.click(await screen.findByRole('button', { name: 'Thu Nov 5' }))
    await user.click(screen.getByRole('button', { name: 'Add workout' }))
    await screen.findByRole('button', { name: 'Workout actions' })
    await openWorkoutSheet(app, 'Edit details')
    const name = screen.getByLabelText('Workout name')
    await user.clear(name)
    await user.type(name, 'Push Day')
    await user.type(screen.getByLabelText('Notes'), 'Felt strong')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Back to week' }))

    expect(await screen.findByRole('heading', { name: "Thursday's workouts" })).toBeInTheDocument()
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Push Day' })).toBeInTheDocument()
    expect(screen.getByText('Felt strong')).toBeInTheDocument()
  })

  it('saves edits automatically without leaving the screen', async () => {
    setToday('2026-11-04')
    const store = newStore()
    const id = await store.createWorkout('2026-11-04', 'Legs')
    const app = await renderApp(store)
    const { user, screen } = app

    await user.click(await screen.findByRole('link', { name: /Legs/ }))
    await screen.findByRole('button', { name: 'Workout actions' })
    await openWorkoutSheet(app, 'Edit details')
    await user.type(screen.getByLabelText('Notes'), 'Knee ok')
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect((await store.getWorkout(id))?.notes).toBe('Knee ok')
  })

  it('reschedules a workout by changing its date', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-02', 'Push Day')
    const app = await renderApp(store)
    const { user, screen } = app

    await user.click(await screen.findByRole('button', { name: 'Mon Nov 2' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    await screen.findByRole('button', { name: 'Workout actions' })
    await openWorkoutSheet(app, 'Edit details')
    const date = screen.getByLabelText('Date')
    await user.clear(date)
    await user.type(date, '2026-11-10')
    await user.click(screen.getByRole('button', { name: 'Back to week' }))

    expect(await screen.findByRole('heading', { name: 'Nov 9 – Nov 15' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Tuesday's workouts" })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Push Day/ })).toBeInTheDocument()
  })
})
