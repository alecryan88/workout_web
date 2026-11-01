import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { did, exerciseAction, newStore, plan, renderApp, seedWorkout, setToday } from './harness'

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

const row = (screen: Awaited<ReturnType<typeof renderApp>>['screen'], name: string) =>
  within(screen.getByRole('region', { name }))

describe('collapsed exercise rows', () => {
  it('shows logged progress, a done state and the last performance line', async () => {
    const { screen } = await openWorkout(
      {
        status: 'done',
        exercises: {
          'Bench Press': [did(8, 185), plan(8, 185), plan(8, 185)],
          Dips: [did(10), did(10)],
        },
      },
      [{ date: '2026-10-28', name: 'Old', status: 'done', exercises: { 'Bench Press': [did(5, 175)] } }],
    )

    const bench = row(screen, 'Bench Press')
    expect(bench.getByText('1/3 sets')).toBeInTheDocument()
    expect(await bench.findByText('Last: 1×5 @ 175 on Oct 28')).toBeInTheDocument()
    expect(bench.queryByText('All sets logged')).not.toBeInTheDocument()

    const dips = row(screen, 'Dips')
    expect(dips.getByText('All sets logged')).toBeInTheDocument()
    expect(dips.queryByText('2/2 sets')).not.toBeInTheDocument()
    expect(dips.queryByText(/^Last:/)).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Bench Press set 1 actual reps')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add set to Bench Press' })).not.toBeInTheDocument()
  })

  it('expands a row on tap, collapses it from its header, and keeps only one open', async () => {
    const { user, screen } = await openWorkout({
      status: 'done',
      exercises: { 'Bench Press': [plan(8, 185)], Dips: [plan(10)] },
    })

    await user.click(screen.getByRole('button', { name: 'Bench Press' }))
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Bench Press set 1 actual reps')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add set to Bench Press' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dips' }))
    expect(screen.getByLabelText('Dips set 1 actual reps')).toBeInTheDocument()
    expect(screen.queryByLabelText('Bench Press set 1 actual reps')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Dips' }))
    expect(screen.queryByLabelText('Dips set 1 actual reps')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('which exercise starts expanded', () => {
  it('opens the first exercise that still has unlogged sets', async () => {
    const { screen } = await openWorkout({
      exercises: { 'Bench Press': [did(8, 185)], Dips: [did(10), plan(10)], Flyes: [plan(12)] },
    })

    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Flyes' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByLabelText('Dips set 2 actual reps')).toBeInTheDocument()
  })

  it('starts with every row collapsed when all sets are logged', async () => {
    const { screen } = await openWorkout({
      exercises: { 'Bench Press': [did(8, 185)], Dips: [did(10)] },
    })

    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('starts with every row collapsed when the workout is done', async () => {
    const { screen } = await openWorkout({
      status: 'done',
      exercises: { 'Bench Press': [plan(8, 185)], Dips: [plan(10)] },
    })

    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('reordering with an exercise expanded', () => {
  it('keeps the same exercise expanded when it moves, and collapses all when it is removed', async () => {
    const app = await openWorkout({
      exercises: { 'Bench Press': [did(8, 185)], Dips: [plan(10)], Flyes: [plan(12)] },
    })
    const { screen } = app
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')

    await exerciseAction(app, 'Dips', 'Move Dips up')
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')

    await exerciseAction(app, 'Dips', 'Move Dips down')
    await exerciseAction(app, 'Dips', 'Move Dips down')
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Bench Press', 'Flyes', 'Dips'])
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Dips set 1 actual reps')).toBeInTheDocument()

    await exerciseAction(app, 'Dips', 'Remove Dips')
    expect(screen.queryByRole('heading', { name: 'Dips' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flyes' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('adding an exercise', () => {
  it('reveals the search field from the add row and expands the new exercise', async () => {
    const { user, screen } = await openWorkout({ exercises: { 'Bench Press': [plan(8, 185)] } })
    expect(screen.queryByLabelText('Add exercise')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Add exercise' }))
    await user.type(screen.getByLabelText('Add exercise'), 'Dips{Enter}')

    expect(await screen.findByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Add set to Dips' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Add exercise')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Add exercise' })).toBeInTheDocument()
  })
})

describe('exercise actions menu', () => {
  it('offers move, edit sets and remove, with moves disabled at the ends', async () => {
    const { user, screen } = await openWorkout({
      exercises: { 'Bench Press': [plan(8, 185)], Dips: [plan(10)] },
    })
    expect(screen.queryByRole('button', { name: 'Actions for Dips' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Bench Press' }))
    const menu = within(screen.getByRole('dialog', { name: 'Bench Press' }))
    expect(menu.getByRole('button', { name: 'Move Bench Press up' })).toBeDisabled()
    expect(menu.getByRole('button', { name: 'Move Bench Press down' })).toBeEnabled()
    expect(menu.getByRole('button', { name: 'Edit sets' })).toBeInTheDocument()
    expect(menu.getByRole('button', { name: 'Remove Bench Press' })).toBeInTheDocument()

    await user.click(menu.getByRole('button', { name: 'Move Bench Press down' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Dips', 'Bench Press'])

    await user.click(screen.getByRole('button', { name: 'Actions for Bench Press' }))
    const again = within(screen.getByRole('dialog', { name: 'Bench Press' }))
    expect(again.getByRole('button', { name: 'Move Bench Press up' })).toBeEnabled()
    expect(again.getByRole('button', { name: 'Move Bench Press down' })).toBeDisabled()
  })
})

describe('edit sets mode', () => {
  it('shows set remove buttons only while editing sets, until Done', async () => {
    const { user, screen } = await openWorkout({
      exercises: { 'Pull-up': [plan(10), plan(8), plan(6)] },
    })
    expect(screen.queryByRole('button', { name: 'Remove Pull-up set 1' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Pull-up' }))
    await user.click(screen.getByRole('button', { name: 'Edit sets' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Pull-up set 2' }))
    expect(screen.getByLabelText('Pull-up set 2 target reps')).toHaveValue(6)
    expect(screen.queryByLabelText('Pull-up set 3 target reps')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('button', { name: 'Remove Pull-up set 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
  })
})
