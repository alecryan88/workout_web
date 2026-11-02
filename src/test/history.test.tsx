import { afterEach, describe, expect, it, vi } from 'vitest'
import { addExercise, did, newStore, plan, renderApp, seedWorkout, setToday, type App } from './harness'
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

const previous = (app: App, set: string) => app.screen.findByTestId(`previous ${set}`)

describe('previous column', () => {
  it('shows each set from the most recent done workout before this one', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-10-20', name: 'Old', status: 'done', exercises: { 'Bench Press': [did(5, 175), did(5, 175)] } })
    await seedWorkout(store, {
      date: '2026-10-27',
      name: 'Recent',
      status: 'done',
      exercises: { 'Bench Press': [did(8, 165), did(7, 165)] },
    })
    await seedWorkout(store, { date: '2026-10-30', name: 'Missed', status: 'planned', exercises: { 'Bench Press': [did(1, 300)] } })
    await seedWorkout(store, { date: '2026-11-06', name: 'Future', status: 'done', exercises: { 'Bench Press': [did(2, 400)] } })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { 'Bench Press': [plan(8, 170), plan(8, 170), plan(8, 170)] } })

    const app = await openToday(store)
    expect(await previous(app, 'Bench Press set 1')).toHaveTextContent('165 lb × 8')
    expect(await previous(app, 'Bench Press set 2')).toHaveTextContent('165 lb × 7')
    expect(await previous(app, 'Bench Press set 3')).toHaveTextContent('—')
    expect(app.screen.queryByText(/^Last:/)).not.toBeInTheDocument()
  })

  it('ignores unticked sets, showing a dash for that set number', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, {
      date: '2026-10-27',
      name: 'Recent',
      status: 'done',
      exercises: { 'Pull-up': [did(10), plan(10), did(8)] },
    })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { 'Pull-up': [plan(10), plan(10), plan(10)] } })

    const app = await openToday(store)
    expect(await previous(app, 'Pull-up set 1')).toHaveTextContent('10 reps')
    expect(await previous(app, 'Pull-up set 2')).toHaveTextContent('—')
    expect(await previous(app, 'Pull-up set 3')).toHaveTextContent('8 reps')
  })

  it('fills a row from its previous value when tapped', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-10-29', name: 'Pulls', status: 'done', exercises: { Deadlift: [did(5, 315)] } })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { Deadlift: [plan(3, 335)] } })

    const app = await openToday(store)
    await app.user.click(await app.screen.findByRole('button', { name: 'Use previous for Deadlift set 1' }))

    expect(app.screen.getByLabelText('Deadlift set 1 lbs')).toHaveValue(315)
    expect(app.screen.getByLabelText('Deadlift set 1 reps')).toHaveValue(5)
  })

  it('shows dashes for an exercise never completed, and loads previous for one added later', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-10-29', name: 'Pulls', status: 'done', exercises: { Deadlift: [did(5, 315)] } })
    await seedWorkout(store, { date: '2026-11-04', name: 'Today', exercises: { 'Brand New': [plan(5)] } })

    const app = await openToday(store)
    expect(await previous(app, 'Brand New set 1')).toHaveTextContent('—')
    expect(app.screen.queryByRole('button', { name: 'Use previous for Brand New set 1' })).not.toBeInTheDocument()

    await addExercise(app, 'Deadlift')
    await app.user.click(await app.screen.findByRole('button', { name: 'Add set to Deadlift' }))
    expect(await previous(app, 'Deadlift set 1')).toHaveTextContent('315 lb × 5')
  })
})
