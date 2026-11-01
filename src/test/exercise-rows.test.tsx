import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { did, newStore, plan, renderApp, seedWorkout, setToday } from './harness'

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
  it('keeps the same exercise expanded when exercises move or are removed', async () => {
    const { user, screen } = await openWorkout({
      exercises: { 'Bench Press': [did(8, 185)], Dips: [plan(10)], Flyes: [plan(12)] },
    })
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Move Dips up' }))
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Bench Press' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Move Flyes up' }))
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Flyes' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Remove Bench Press' }))
    await user.click(screen.getByRole('button', { name: 'Move Dips down' }))
    expect(screen.getByRole('button', { name: 'Dips' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Dips set 1 actual reps')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Dips' }))
    expect(screen.getByRole('button', { name: 'Flyes' })).toHaveAttribute('aria-expanded', 'false')
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
