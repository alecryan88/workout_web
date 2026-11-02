import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addExercise, did, exerciseAction, newStore, openWorkoutSheet, plan, renderApp, seedWorkout, setToday, type App } from './harness'
import type { Store } from '../store/types'

afterEach(() => {
  vi.useRealTimers()
})

async function openTemplates(store: Store = newStore()) {
  setToday('2026-11-04')
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: 'Templates' }))
  await app.screen.findByRole('heading', { level: 1, name: 'Templates' })
  return app
}

const templateLinks = (app: App) =>
  within(app.screen.getByRole('list', { name: 'Templates' }))
    .queryAllByRole('link')
    .map((l) => l.textContent)

async function templateAction(app: App, action: string) {
  await app.user.click(app.screen.getByRole('button', { name: 'Template actions' }))
  await app.user.click(app.screen.getByRole('button', { name: action }))
}

async function seedTemplate(store: Store) {
  const bench = await store.findOrCreateExercise('Bench Press')
  return store.saveTemplate({
    id: null,
    name: 'Push A',
    notes: 'Heavy day',
    exercises: [{ exercise: bench, restSeconds: 180, sets: [{ weight: 185, reps: 5 }, { weight: 185, reps: 5 }] }],
  })
}

describe('templates screen', () => {
  it('creates a template from scratch and lists it with its exercise count', async () => {
    const app = await openTemplates()
    const { user, screen } = app
    expect(templateLinks(app)).toEqual([])

    await user.click(screen.getByRole('button', { name: 'New template' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'New Template' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument()

    await templateAction(app, 'Edit name & notes')
    const name = screen.getByLabelText('Template name')
    await user.clear(name)
    await user.type(name, 'Push A')
    await user.type(screen.getByLabelText('Notes'), 'Heavy day')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Push A' })).toBeInTheDocument()
    expect(screen.getByText('Heavy day')).toBeInTheDocument()

    await addExercise(app, 'Bench Press')
    await user.click(await screen.findByRole('button', { name: 'Add set to Bench Press' }))
    await user.type(screen.getByLabelText('Bench Press set 1 lbs'), '185')
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '5')
    await user.click(screen.getByRole('button', { name: 'Add set to Bench Press' }))
    expect(screen.queryByRole('button', { name: /^Complete / })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add set to Bench Press' })).toHaveTextContent('+ Add Set (2:00)')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('heading', { level: 1, name: 'Templates' })
    expect(templateLinks(app)).toEqual([expect.stringContaining('Push A')])
    expect(screen.getByRole('link', { name: /Push A/ })).toHaveTextContent('1 exercise')

    await user.click(screen.getByRole('link', { name: /Push A/ }))
    expect(await screen.findByLabelText('Bench Press set 2 lbs')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 2 reps')).toHaveValue(5)
    expect(screen.getByText('Heavy day')).toBeInTheDocument()
  })

  it('closes without asking when nothing changed, and confirms before discarding edits', async () => {
    const store = newStore()
    await seedTemplate(store)
    const app = await openTemplates(store)
    const { user, screen } = app

    await user.click(screen.getByRole('link', { name: /Push A/ }))
    await screen.findByRole('heading', { level: 1, name: 'Push A' })
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await screen.findByRole('heading', { level: 1, name: 'Templates' })

    await user.click(screen.getByRole('link', { name: /Push A/ }))
    await user.clear(await screen.findByLabelText('Bench Press set 1 reps'))
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '3')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    const confirm = within(screen.getByRole('dialog', { name: 'Discard changes?' }))
    await user.click(confirm.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByLabelText('Bench Press set 1 reps')).toHaveValue(3)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    await screen.findByRole('heading', { level: 1, name: 'Templates' })
    await user.click(screen.getByRole('link', { name: /Push A/ }))
    expect(await screen.findByLabelText('Bench Press set 1 reps')).toHaveValue(5)
  })

  it('reorders and removes exercises from their menus, like the workout screen', async () => {
    const store = newStore()
    await seedTemplate(store)
    const app = await openTemplates(store)
    const { user, screen } = app
    await user.click(screen.getByRole('link', { name: /Push A/ }))
    await addExercise(app, 'Dips')
    await screen.findByRole('heading', { name: 'Dips' })

    await exerciseAction(app, 'Dips', 'Move Dips up')
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Dips', 'Bench Press'])
    await exerciseAction(app, 'Bench Press', 'Remove Bench Press')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('link', { name: /Push A/ })).toHaveTextContent('1 exercise')
  })

  it('deletes a template after confirmation', async () => {
    const store = newStore()
    await seedTemplate(store)
    const app = await openTemplates(store)
    const { user, screen } = app

    await user.click(screen.getByRole('link', { name: /Push A/ }))
    await screen.findByRole('heading', { level: 1, name: 'Push A' })
    await templateAction(app, 'Delete')
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await screen.findByRole('heading', { level: 1, name: 'Templates' })
    expect(templateLinks(app)).toEqual([])
  })
})

describe('save as template', () => {
  it('copies a workout’s exercises, sets and rest times into a new template, leaving the workout alone', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, {
      date: '2026-11-04',
      name: 'Push Day',
      notes: 'Pause reps',
      exercises: { 'Bench Press': [did(6, 185), plan(8, 180)], Dips: [plan(10)] },
    })
    const app = await renderApp(store)
    const { user, screen } = app
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    await screen.findByRole('button', { name: 'Workout actions' })

    await openWorkoutSheet(app, 'Save as template')
    expect(await screen.findByRole('heading', { level: 1, name: 'Push Day' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Template actions' })).toBeInTheDocument()
    expect(screen.getByText('Pause reps')).toBeInTheDocument()
    expect(screen.getByLabelText('Bench Press set 1 reps')).toHaveValue(6)
    expect(screen.getByLabelText('Bench Press set 2 lbs')).toHaveValue(180)
    expect(screen.getByLabelText('Dips set 1 reps')).toHaveValue(10)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(await screen.findByRole('link', { name: /Push Day/ })).toHaveTextContent('2 exercises')

    await templateDeleteFromList(app, 'Push Day')
    await user.click(screen.getByRole('link', { name: 'Workouts' }))
    expect(await screen.findByRole('link', { name: /Push Day/ })).toHaveTextContent('2 exercises · 1/3 sets')
  })
})

async function templateDeleteFromList(app: App, name: string) {
  await app.user.click(app.screen.getByRole('link', { name: new RegExp(name) }))
  await app.screen.findByRole('button', { name: 'Template actions' })
  await templateAction(app, 'Delete')
  await app.user.click(app.screen.getByRole('button', { name: 'Yes, delete' }))
  await app.screen.findByRole('heading', { level: 1, name: 'Templates' })
}
