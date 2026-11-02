import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addExercise, exerciseAction, newStore, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

async function openWorkout(name = 'Push Day') {
  setToday('2026-11-04')
  const store = newStore()
  await store.createWorkout('2026-11-04', name)
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: new RegExp(name) }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return { ...app, store }
}

describe('exercises in a workout', () => {
  it('autocompletes from saved exercises', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.findOrCreateExercise('Bench Press')
    await store.findOrCreateExercise('Back Squat')
    await store.findOrCreateExercise('Deadlift')
    await store.createWorkout('2026-11-04', 'Push Day')
    const { user, screen } = await renderApp(store)
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))

    await user.click(await screen.findByRole('button', { name: '+ Add exercise' }))
    await user.type(screen.getByLabelText('Add exercise'), 'b')
    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['Back Squat', 'Bench Press'])

    await user.click(within(listbox).getByRole('option', { name: 'Bench Press' }))
    expect(await screen.findByRole('heading', { name: 'Bench Press' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Add exercise')).not.toBeInTheDocument()
  })

  it('creates a new exercise from a typed name and matches names case-insensitively', async () => {
    const app = await openWorkout()
    const { user, screen } = app

    await addExercise(app, 'Overhead Press')
    expect(await screen.findByRole('heading', { name: 'Overhead Press' })).toBeInTheDocument()

    await addExercise(app, 'overhead press')
    expect(await screen.findAllByRole('heading', { name: 'Overhead Press' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: '+ Add exercise' }))
    await user.type(screen.getByLabelText('Add exercise'), 'over')
    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['Overhead Press'])
  })

  it('removes and reorders exercises', async () => {
    const app = await openWorkout()
    const { user, screen } = app
    for (const name of ['Bench Press', 'Dips', 'Flyes']) {
      await addExercise(app, name)
      await screen.findByRole('heading', { name })
    }

    await exerciseAction(app, 'Flyes', 'Move Flyes up')
    await exerciseAction(app, 'Bench Press', 'Remove Bench Press')

    const headings = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings()).toEqual(['Flyes', 'Dips'])

    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    await screen.findByRole('heading', { name: 'Flyes' })
    expect(headings()).toEqual(['Flyes', 'Dips'])
  })
})

describe('sets', () => {
  it('plans sets with reps and weight, prefilling new sets from the previous one', async () => {
    const app = await openWorkout()
    const { user, screen } = app
    await addExercise(app, 'Bench Press')

    await user.click(await screen.findByRole('button', { name: 'Add set to Bench Press' }))
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '8')
    await user.type(screen.getByLabelText('Bench Press set 1 lbs'), '185')
    await user.click(screen.getByRole('button', { name: 'Add set to Bench Press' }))

    expect(screen.getByLabelText('Bench Press set 2 reps')).toHaveValue(8)
    expect(screen.getByLabelText('Bench Press set 2 lbs')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 2 reps')).toHaveAttribute('inputmode', 'numeric')

    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    expect(await screen.findByLabelText('Bench Press set 2 lbs')).toHaveValue(185)
  })

  it('allows bodyweight sets with no weight and removing a set', async () => {
    const app = await openWorkout()
    const { user, screen } = app
    await addExercise(app, 'Pull-up')
    await user.click(await screen.findByRole('button', { name: 'Add set to Pull-up' }))
    await user.type(screen.getByLabelText('Pull-up set 1 reps'), '10')
    await user.click(screen.getByRole('button', { name: 'Add set to Pull-up' }))
    await user.click(screen.getByRole('button', { name: 'Add set to Pull-up' }))
    await user.clear(screen.getByLabelText('Pull-up set 3 reps'))
    await user.type(screen.getByLabelText('Pull-up set 3 reps'), '6')

    await exerciseAction(app, 'Pull-up', 'Edit sets')
    await user.click(screen.getByRole('button', { name: 'Remove Pull-up set 2' }))

    expect(screen.getByLabelText('Pull-up set 1 lbs')).toHaveValue(null)
    expect(screen.getByLabelText('Pull-up set 2 reps')).toHaveValue(6)
    expect(screen.queryByLabelText('Pull-up set 3 reps')).not.toBeInTheDocument()
  })
})
