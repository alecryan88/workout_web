import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

async function workoutWithBench() {
  setToday('2026-11-04')
  const store = newStore()
  const bench = await store.findOrCreateExercise('Bench Press')
  const id = await store.createWorkout('2026-11-04', 'Push Day')
  const workout = (await store.getWorkout(id))!
  await store.saveWorkout({
    ...workout,
    exercises: [
      {
        exercise: bench,
        sets: [
          { targetReps: 8, targetWeight: 185, actualReps: null, actualWeight: null },
          { targetReps: 8, targetWeight: 185, actualReps: null, actualWeight: null },
        ],
      },
    ],
  })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByLabelText('Workout name')
  return app
}

describe('logging at the gym', () => {
  it('records actual reps and weight next to the targets', async () => {
    const { user, screen } = await workoutWithBench()

    expect(screen.getByLabelText('Bench Press set 1 target reps')).toHaveValue(8)
    await user.type(screen.getByLabelText('Bench Press set 2 actual reps'), '6')
    await user.type(screen.getByLabelText('Bench Press set 2 actual weight'), '185')

    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    expect(await screen.findByLabelText('Bench Press set 2 actual reps')).toHaveValue(6)
    expect(screen.getByLabelText('Bench Press set 2 actual weight')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 1 actual reps')).toHaveValue(null)
  })

  it('fills actuals from targets in one tap', async () => {
    const { user, screen } = await workoutWithBench()

    await user.click(screen.getByRole('button', { name: 'Bench Press set 1 hit target' }))

    expect(screen.getByLabelText('Bench Press set 1 actual reps')).toHaveValue(8)
    expect(screen.getByLabelText('Bench Press set 1 actual weight')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 2 actual reps')).toHaveValue(null)
  })

  it('logs a bonus set that was not planned', async () => {
    const { user, screen } = await workoutWithBench()

    await user.click(screen.getByRole('button', { name: 'Add set to Bench Press' }))
    await user.type(screen.getByLabelText('Bench Press set 3 actual reps'), '5')

    expect(screen.getByLabelText('Bench Press set 3 actual reps')).toHaveValue(5)
    expect(screen.getByLabelText('Bench Press set 3 actual weight')).toHaveValue(null)
  })

  it('marks a workout done, shows it in the week, and can unmark it', async () => {
    const { user, screen } = await workoutWithBench()

    await user.click(screen.getByRole('button', { name: 'Mark done' }))
    expect(await screen.findByRole('button', { name: 'Mark not done' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Notes'), 'Edited after done')

    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    expect(await screen.findByRole('heading', { name: "Today's workouts" })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Push Day/ })).toHaveTextContent(/done/i)

    await user.click(screen.getByRole('link', { name: /Push Day/ }))
    expect(await screen.findByLabelText('Notes')).toHaveValue('Edited after done')
    await user.click(screen.getByRole('button', { name: 'Mark not done' }))
    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    expect(await screen.findByRole('heading', { name: "Today's workouts" })).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: /Push Day/ })
    expect(link).not.toHaveTextContent(/done/i)
  })
})
