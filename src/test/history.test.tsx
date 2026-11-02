import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addExercise, did, newStore, plan, renderApp, seedWorkout, setToday } from './harness'
import type { Store } from '../store/types'

afterEach(() => {
  vi.useRealTimers()
})

async function openToday(store: Store) {
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Today/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

describe('last performance', () => {
  it('shows completed sets from the most recent completed workout before this one', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-10-20', name: 'Old', status: 'done', exercises: { 'Bench Press': [did(5, 175), did(5, 175)] } })
    await seedWorkout(store, {
      date: '2026-10-27',
      name: 'Recent',
      status: 'done',
      exercises: { 'Bench Press': [did(8, 185), did(8, 185), did(8, 185), plan(10, 200)] },
    })
    await seedWorkout(store, { date: '2026-10-30', name: 'Missed', status: 'planned', exercises: { 'Bench Press': [did(1, 300)] } })
    await seedWorkout(store, { date: '2026-11-06', name: 'Future', status: 'done', exercises: { 'Bench Press': [did(2, 400)] } })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { 'Bench Press': [plan(8, 190)] } })

    const { screen } = await openToday(store)
    const bench = within(screen.getByRole('region', { name: 'Bench Press' }))
    expect(await bench.findByText('Last: 3×8 @ 185 on Oct 27')).toBeInTheDocument()
  })

  it('summarises sets truthfully when reps or weights differ', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, {
      date: '2026-10-27',
      name: 'Recent',
      status: 'done',
      exercises: {
        'Bench Press': [did(8, 185), did(8, 185), did(6, 185)],
        Squat: [did(5, 225), did(5, 245), did(3, 265)],
        'Pull-up': [did(10), did(10), plan(12)],
      },
    })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { 'Bench Press': [], Squat: [], 'Pull-up': [] } })

    const { screen } = await openToday(store)
    expect(await screen.findByText('Last: 8, 8, 6 @ 185 on Oct 27')).toBeInTheDocument()
    expect(screen.getByText('Last: 5 @ 225, 5 @ 245, 3 @ 265 on Oct 27')).toBeInTheDocument()
    expect(screen.getByText('Last: 2×10 on Oct 27')).toBeInTheDocument()
  })

  it('shows no last line for an exercise never completed, and updates when one is added', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-10-29', name: 'Pulls', status: 'done', exercises: { Deadlift: [did(5, 315)] } })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { 'Brand New': [plan(5)] } })

    const app = await openToday(store)
    const { screen } = app
    await addExercise(app, 'Deadlift')

    expect(await screen.findByText('Last: 1×5 @ 315 on Oct 29')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Brand New' })).queryByText(/^Last:/)).not.toBeInTheDocument()
  })
})
