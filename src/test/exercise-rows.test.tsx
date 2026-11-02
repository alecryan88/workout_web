import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { did, exerciseAction, newStore, plan, renderApp, seedWorkout, setToday, type App } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

type Seed = Parameters<typeof seedWorkout>[1]

async function openWorkout(seed: Omit<Seed, 'date' | 'name'>, history: Seed[] = []) {
  setToday('2026-11-04')
  const store = newStore()
  for (const past of history) await seedWorkout(store, past)
  await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', ...seed })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

const headings = (screen: App['screen']) => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

describe('exercise blocks', () => {
  it('shows every exercise expanded with its set table and add set button', async () => {
    const { screen } = await openWorkout({
      status: 'done',
      exercises: { 'Bench Press': [did(8, 185), plan(8, 185)], Dips: [plan(10)], Plank: [] },
    })

    for (const name of ['Bench Press', 'Dips', 'Plank']) {
      expect(screen.getByRole('button', { name: `Add set to ${name}` })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Bench Press set 2 lbs')).toBeInTheDocument()
    expect(screen.getByLabelText('Dips set 1 reps')).toHaveValue(10)
    expect(screen.queryByRole('button', { name: 'Bench Press', expanded: false })).not.toBeInTheDocument()
  })

  it('highlights ticked rows', async () => {
    const { screen } = await openWorkout({ exercises: { 'Bench Press': [did(8, 185), plan(8, 185)] } })

    const block = within(screen.getByRole('region', { name: 'Bench Press' }))
    const rows = block.getAllByRole('group')
    expect(rows[0]).toHaveClass('completed')
    expect(rows[1]).not.toHaveClass('completed')
  })
})

describe('adding an exercise', () => {
  it('reveals the search field from the add row and shows the new exercise', async () => {
    const { user, screen } = await openWorkout({ exercises: { 'Bench Press': [plan(8, 185)] } })
    expect(screen.queryByLabelText('Add exercise')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Add exercise' }))
    await user.type(screen.getByLabelText('Add exercise'), 'Dips{Enter}')

    expect(await screen.findByRole('heading', { name: 'Dips' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add set to Dips' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Add exercise')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Add exercise' })).toBeInTheDocument()
  })
})

describe('exercise actions menu', () => {
  it('offers move, edit sets and remove, with moves disabled at the ends', async () => {
    const app = await openWorkout({
      exercises: { 'Bench Press': [plan(8, 185)], Dips: [plan(10)] },
    })
    const { user, screen } = app

    await user.click(screen.getByRole('button', { name: 'Actions for Bench Press' }))
    const menu = within(screen.getByRole('dialog', { name: 'Bench Press' }))
    expect(menu.getByRole('button', { name: 'Move Bench Press up' })).toBeDisabled()
    expect(menu.getByRole('button', { name: 'Move Bench Press down' })).toBeEnabled()
    expect(menu.getByRole('button', { name: 'Edit sets' })).toBeInTheDocument()
    expect(menu.getByRole('button', { name: 'Remove Bench Press' })).toBeInTheDocument()

    await user.click(menu.getByRole('button', { name: 'Move Bench Press down' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(headings(screen)).toEqual(['Dips', 'Bench Press'])

    await user.click(screen.getByRole('button', { name: 'Actions for Bench Press' }))
    const again = within(screen.getByRole('dialog', { name: 'Bench Press' }))
    expect(again.getByRole('button', { name: 'Move Bench Press up' })).toBeEnabled()
    expect(again.getByRole('button', { name: 'Move Bench Press down' })).toBeDisabled()

    await user.click(again.getByRole('button', { name: 'Remove Bench Press' }))
    expect(headings(screen)).toEqual(['Dips'])
  })
})

describe('edit sets mode', () => {
  it('shows set remove buttons only while editing sets, until Done', async () => {
    const app = await openWorkout({
      exercises: { 'Pull-up': [plan(10), plan(8), plan(6)] },
    })
    const { user, screen } = app
    expect(screen.queryByRole('button', { name: 'Remove Pull-up set 1' })).not.toBeInTheDocument()

    await exerciseAction(app, 'Pull-up', 'Edit sets')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Pull-up set 2' }))
    expect(screen.getByLabelText('Pull-up set 2 reps')).toHaveValue(6)
    expect(screen.queryByLabelText('Pull-up set 3 reps')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('button', { name: 'Remove Pull-up set 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
  })
})
