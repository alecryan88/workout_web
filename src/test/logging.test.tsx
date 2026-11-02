import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, openWorkoutSheet, plan, renderApp, seedWorkout, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

async function workoutWithBench() {
  setToday('2026-11-04')
  const store = newStore()
  await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', exercises: { 'Bench Press': [plan(8, 185), plan(8, 185)] } })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

async function reopen(app: Awaited<ReturnType<typeof workoutWithBench>>) {
  await app.user.click(app.screen.getByRole('button', { name: 'Back to week' }))
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
}

describe('logging at the gym', () => {
  it('starts each set with the planned lbs and reps, unticked', async () => {
    const { screen } = await workoutWithBench()

    expect(screen.getByLabelText('Bench Press set 1 lbs')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 1 reps')).toHaveValue(8)
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 1' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('ticks a set in one tap and keeps the tick after reopening', async () => {
    const app = await workoutWithBench()
    const { user, screen } = app

    await user.click(screen.getByRole('button', { name: 'Complete Bench Press set 1' }))
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 1' })).toHaveAttribute('aria-pressed', 'true')

    await reopen(app)
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 2' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Bench Press set 1 lbs')).toHaveValue(185)
  })

  it('changes lbs and reps before and after ticking, and can untick', async () => {
    const app = await workoutWithBench()
    const { user, screen } = app

    await user.clear(screen.getByLabelText('Bench Press set 2 reps'))
    await user.type(screen.getByLabelText('Bench Press set 2 reps'), '6')
    await user.click(screen.getByRole('button', { name: 'Complete Bench Press set 2' }))
    await user.clear(screen.getByLabelText('Bench Press set 2 lbs'))
    await user.type(screen.getByLabelText('Bench Press set 2 lbs'), '175')

    await reopen(app)
    expect(screen.getByLabelText('Bench Press set 2 reps')).toHaveValue(6)
    expect(screen.getByLabelText('Bench Press set 2 lbs')).toHaveValue(175)
    await user.click(screen.getByRole('button', { name: 'Complete Bench Press set 2' }))
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 2' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('logs a bonus set prefilled from the set before it', async () => {
    const { user, screen } = await workoutWithBench()

    await user.click(screen.getByRole('button', { name: 'Add set to Bench Press' }))

    expect(screen.getByLabelText('Bench Press set 3 lbs')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 3 reps')).toHaveValue(8)
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 3' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('can still edit a workout after finishing it, and unmark it', async () => {
    const app = await workoutWithBench()
    const { user, screen } = app

    await user.click(screen.getByRole('button', { name: 'Finish' }))
    await user.click(screen.getByRole('button', { name: 'Finish anyway' }))
    await openWorkoutSheet(app, 'Edit details')
    await user.type(screen.getByLabelText('Notes'), 'Edited after done')
    await user.click(screen.getByRole('button', { name: 'Done' }))

    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    expect(await screen.findByRole('heading', { name: "Today's workouts" })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Push Day/ })).toHaveTextContent(/done/i)

    await user.click(screen.getByRole('link', { name: /Push Day/ }))
    expect(await screen.findByText('Edited after done')).toBeInTheDocument()
    await openWorkoutSheet(app, 'Mark not done')
    await screen.findByRole('button', { name: 'Start' })
    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    expect(await screen.findByRole('heading', { name: "Today's workouts" })).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: /Push Day/ })
    expect(link).not.toHaveTextContent(/done/i)
  })
})
