import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addExercise, newStore, plan, renderApp, seedWorkout, setToday, type App } from './harness'
import type { Store } from '../store/types'

afterEach(() => {
  vi.useRealTimers()
})

async function openExercises(store: Store) {
  setToday('2026-11-04')
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: 'Exercises' }))
  await app.screen.findByRole('heading', { level: 1, name: 'Exercises' })
  return app
}

const listed = (app: App) =>
  within(app.screen.getByRole('list', { name: 'Exercises' }))
    .queryAllByRole('button')
    .map((b) => b.getAttribute('aria-label'))

async function createExercise(app: App, fields: { name: string; equipment?: string; muscle?: string; notes?: string }) {
  const { user, screen } = app
  await user.click(screen.getByRole('button', { name: 'New exercise' }))
  const sheet = within(screen.getByRole('dialog', { name: 'New exercise' }))
  await user.type(sheet.getByLabelText('Name'), fields.name)
  if (fields.equipment) await user.selectOptions(sheet.getByLabelText('Equipment'), fields.equipment)
  if (fields.muscle) await user.selectOptions(sheet.getByLabelText('Muscle group'), fields.muscle)
  if (fields.notes) await user.type(sheet.getByLabelText('Notes'), fields.notes)
  await user.click(sheet.getByRole('button', { name: 'Save' }))
}

describe('tab bar', () => {
  it('moves between Workouts, Templates and Exercises and hides inside a workout', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-04', 'Push Day')
    const { user, screen } = await renderApp(store)

    const tabs = within(await screen.findByRole('navigation', { name: 'Tabs' }))
    expect(tabs.getByRole('link', { name: 'Workouts' })).toHaveAttribute('aria-current', 'page')
    await user.click(tabs.getByRole('link', { name: 'Templates' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Templates' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Exercises' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Workouts' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    await screen.findByRole('button', { name: 'Workout actions' })
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument()
  })
})

describe('exercise library', () => {
  it('lists active exercises alphabetically as name and equipment, filtered by search', async () => {
    const store = newStore()
    await store.createExercise({ name: 'Squat', equipment: 'barbell', muscleGroup: 'legs', notes: '' })
    await store.createExercise({ name: 'Bench Press', equipment: 'dumbbell', muscleGroup: null, notes: '' })
    await store.createExercise({ name: 'Bench Press', equipment: 'barbell', muscleGroup: 'chest', notes: '' })
    await store.findOrCreateExercise('Ab Wheel')
    const app = await openExercises(store)

    expect(listed(app)).toEqual(['Ab Wheel', 'Bench Press (Barbell)', 'Bench Press (Dumbbell)', 'Squat (Barbell)'])
    await app.user.type(app.screen.getByLabelText('Search exercises'), 'bench')
    expect(listed(app)).toEqual(['Bench Press (Barbell)', 'Bench Press (Dumbbell)'])
  })

  it('creates exercises with equipment, muscle group and notes, unique by name and equipment', async () => {
    const app = await openExercises(newStore())
    const { user, screen } = app

    await createExercise(app, { name: 'Bench Press', equipment: 'Barbell', muscle: 'Chest', notes: 'Retract shoulders' })
    await createExercise(app, { name: 'Bench Press', equipment: 'Dumbbell' })
    expect(listed(app)).toEqual(['Bench Press (Barbell)', 'Bench Press (Dumbbell)'])

    await createExercise(app, { name: 'bench press', equipment: 'Barbell' })
    expect(within(screen.getByRole('dialog', { name: 'New exercise' })).getByRole('alert')).toHaveTextContent(/already exists/i)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(listed(app)).toEqual(['Bench Press (Barbell)', 'Bench Press (Dumbbell)'])

    await user.click(screen.getByRole('button', { name: 'Bench Press (Barbell)' }))
    const sheet = within(screen.getByRole('dialog', { name: 'Edit exercise' }))
    expect(sheet.getByLabelText('Muscle group')).toHaveValue('chest')
    expect(sheet.getByLabelText('Notes')).toHaveValue('Retract shoulders')
  })

  it('edits an exercise', async () => {
    const store = newStore()
    await store.findOrCreateExercise('Incline Bench')
    const app = await openExercises(store)
    const { user, screen } = app

    await user.click(screen.getByRole('button', { name: 'Incline Bench' }))
    const sheet = within(screen.getByRole('dialog', { name: 'Edit exercise' }))
    await user.clear(sheet.getByLabelText('Name'))
    await user.type(sheet.getByLabelText('Name'), 'Incline Bench Press')
    await user.selectOptions(sheet.getByLabelText('Equipment'), 'Barbell')
    await user.click(sheet.getByRole('button', { name: 'Save' }))

    expect(listed(app)).toEqual(['Incline Bench Press (Barbell)'])
  })

  it('removes an unused exercise and archives a used one, keeping its history', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.findOrCreateExercise('Typo Press')
    await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', exercises: { Dips: [plan(10)] } })
    const app = await openExercises(store)
    const { user, screen } = app

    for (const name of ['Typo Press', 'Dips']) {
      await user.click(screen.getByRole('button', { name }))
      await user.click(screen.getByRole('button', { name: 'Delete exercise' }))
      await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    }
    expect(await screen.findByRole('status')).toHaveTextContent('Dips was archived')
    expect(listed(app)).toEqual([])

    await user.click(screen.getByRole('link', { name: 'Workouts' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    expect(await screen.findByRole('heading', { name: 'Dips' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '+ Add exercise' }))
    await user.type(screen.getByLabelText('Add exercise'), 'D')
    await user.type(screen.getByLabelText('Add exercise'), 'i')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

describe('re-creating an archived exercise', () => {
  it('restores it with the new details instead of reporting a duplicate', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', exercises: { Dips: [plan(10)] } })
    const app = await openExercises(store)
    const { user, screen } = app

    await user.click(screen.getByRole('button', { name: 'Dips' }))
    await user.click(screen.getByRole('button', { name: 'Delete exercise' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(listed(app)).toEqual([])

    await createExercise(app, { name: 'dips', muscle: 'Chest' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listed(app)).toEqual(['dips'])
  })

  it('says when a search matches nothing', async () => {
    const store = newStore()
    await store.findOrCreateExercise('Dips')
    const app = await openExercises(store)
    await app.user.type(app.screen.getByLabelText('Search exercises'), 'zzz')
    expect(app.screen.getByText('No exercises match “zzz”.')).toBeInTheDocument()
  })
})

describe('exercises in the workout screen', () => {
  it('chooses between variants in the picker and labels bodyweight weight as +lbs', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createExercise({ name: 'Bench Press', equipment: 'barbell', muscleGroup: null, notes: '' })
    await store.createExercise({ name: 'Bench Press', equipment: 'dumbbell', muscleGroup: null, notes: '' })
    await store.createExercise({ name: 'Dip', equipment: 'bodyweight', muscleGroup: null, notes: '' })
    await store.createWorkout('2026-11-04', 'Push Day')
    const app = await renderApp(store)
    const { user, screen } = app
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))

    await user.click(await screen.findByRole('button', { name: '+ Add exercise' }))
    await user.type(screen.getByLabelText('Add exercise'), 'bench')
    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['Bench Press (Barbell)', 'Bench Press (Dumbbell)'])
    await user.click(within(listbox).getByRole('option', { name: 'Bench Press (Dumbbell)' }))
    expect(await screen.findByRole('heading', { name: 'Bench Press (Dumbbell)' })).toBeInTheDocument()

    await addExercise(app, 'Dip')
    await user.click(await screen.findByRole('button', { name: 'Add set to Dip (Bodyweight)' }))
    const dip = within(screen.getByRole('region', { name: 'Dip (Bodyweight)' }))
    expect(dip.getByText('+lbs')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Bench Press (Dumbbell)' })).queryByText('+lbs')).not.toBeInTheDocument()
  })

  it('creates a typed new exercise inline with equipment other, shown in the library', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-04', 'Push Day')
    const app = await renderApp(store)
    const { user, screen } = app
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    await addExercise(app, 'Cable Fly')
    expect(await screen.findByRole('heading', { name: 'Cable Fly' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    await user.click(await screen.findByRole('link', { name: 'Exercises' }))
    await user.click(await screen.findByRole('button', { name: 'Cable Fly' }))
    const sheet = within(screen.getByRole('dialog', { name: 'Edit exercise' }))
    expect(sheet.getByLabelText('Equipment')).toHaveValue('other')
    expect(sheet.getByLabelText('Muscle group')).toHaveValue('')
  })
})
