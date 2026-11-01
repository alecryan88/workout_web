import { within } from '@testing-library/react'
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

    await user.click(await screen.findByRole('button', { name: 'Add workout to Thu Nov 5' }))
    await screen.findByRole('button', { name: 'Workout actions' })
    await openWorkoutSheet(app, 'Edit details')
    const name = screen.getByLabelText('Workout name')
    await user.clear(name)
    await user.type(name, 'Push Day')
    await user.type(screen.getByLabelText('Notes'), 'Felt strong')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Back to week' }))

    const thursday = within(await screen.findByRole('region', { name: 'Thu Nov 5' }))
    await user.click(await thursday.findByRole('link', { name: /Push Day/ }))

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

    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    await screen.findByRole('button', { name: 'Workout actions' })
    await openWorkoutSheet(app, 'Edit details')
    const date = screen.getByLabelText('Date')
    await user.clear(date)
    await user.type(date, '2026-11-10')
    await user.click(screen.getByRole('button', { name: 'Back to week' }))

    expect(await screen.findByRole('heading', { name: 'Week of Nov 9' })).toBeInTheDocument()
    const tuesday = within(screen.getByRole('region', { name: 'Tue Nov 10' }))
    expect(await tuesday.findByRole('link', { name: /Push Day/ })).toBeInTheDocument()
  })
})
