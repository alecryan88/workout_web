import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

describe('connection problems', () => {
  it('tells me when my changes did not save', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-04', 'Legs')
    const offline = { ...store, saveWorkout: () => Promise.reject(new Error('Failed to fetch')) }
    const { user, screen } = await renderApp(offline)

    await user.click(await screen.findByRole('link', { name: /Legs/ }))
    await user.type(await screen.findByLabelText('Notes'), 'x')

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t save/i)
  })

  it('tells me when the week could not load', async () => {
    setToday('2026-11-04')
    const offline = { ...newStore(), listWorkouts: () => Promise.reject(new Error('Failed to fetch')) }
    const { screen } = await renderApp(offline)

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  })
})
