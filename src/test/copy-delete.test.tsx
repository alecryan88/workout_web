import { afterEach, describe, expect, it, vi } from 'vitest'
import { did, newStore, plan, type App, openWorkoutSheet, renderApp, seedWorkout, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

async function setup() {
  setToday('2026-11-04')
  const store = newStore()
  await seedWorkout(store, {
    date: '2026-11-02',
    name: 'Push Day',
    status: 'done',
    notes: 'Pause reps',
    exercises: {
      'Bench Press': [did(6, 185), plan(8, 180), did(5, 175)],
      Dips: [did(10)],
    },
  })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('button', { name: 'Mon Nov 2' }))
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

async function copyTo(app: App, dates: string[], tickedOnly = false) {
  const { user, screen } = app
  await openWorkoutSheet(app, 'Copy')
  for (const date of dates) {
    await user.type(screen.getByLabelText('Copy to date'), date)
    await user.click(screen.getByRole('button', { name: 'Add date' }))
  }
  if (tickedOnly) await user.click(screen.getByLabelText('Copy ticked values only'))
  const count = dates.length === 1 ? '1 date' : `${dates.length} dates`
  await user.click(screen.getByRole('button', { name: `Copy to ${count}` }))
  expect(await screen.findByText(`Copied to ${count}`)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Close' }))
}

async function openOn(app: App, weekTitle: string, dayName: string) {
  const { user, screen } = app
  await user.click(screen.getByRole('button', { name: 'Back to week' }))
  await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })
  while (!screen.queryByRole('heading', { name: weekTitle })) {
    await user.click(screen.getByRole('button', { name: 'Next week' }))
  }
  await user.click(screen.getByRole('button', { name: dayName }))
  const link = await screen.findByRole('link', { name: /Push Day/ })
  expect(link).not.toHaveTextContent(/done/i)
  await user.click(link)
  await screen.findByRole('button', { name: 'Workout actions' })
}

describe('copying a workout', () => {
  it('copies to several dates as fresh planned workouts with every set unticked', async () => {
    const app = await setup()
    await copyTo(app, ['2026-11-09', '2026-11-16'])

    await openOn(app, 'Nov 16 – Nov 22', 'Mon Nov 16')
    const { screen } = app
    expect(screen.getByRole('heading', { level: 1, name: 'Push Day' })).toBeInTheDocument()
    expect(screen.getByText('Pause reps')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Bench Press', 'Dips'])
    expect(screen.getByLabelText('Bench Press set 1 reps')).toHaveValue(6)
    expect(screen.getByLabelText('Bench Press set 2 lbs')).toHaveValue(180)
    expect(screen.getByLabelText('Bench Press set 3 lbs')).toHaveValue(175)
    expect(screen.getByLabelText('Dips set 1 reps')).toHaveValue(10)
    for (const name of ['Bench Press set 1', 'Bench Press set 2', 'Bench Press set 3', 'Dips set 1']) {
      expect(screen.getByRole('button', { name: `Complete ${name}` })).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.getByRole('button', { name: 'Mark done' })).toBeInTheDocument()

    await app.user.click(screen.getByRole('button', { name: 'Back to week' }))
    await app.user.click(await screen.findByRole('button', { name: 'Previous week' }))
    expect(await screen.findByRole('heading', { name: 'Nov 9 – Nov 15' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Monday's workouts" })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Push Day/ })).toBeInTheDocument()
  })

  it('can copy only the ticked sets with their values', async () => {
    const app = await setup()
    await copyTo(app, ['2026-11-09'], true)

    await openOn(app, 'Nov 9 – Nov 15', 'Mon Nov 9')
    const { screen } = app
    expect(screen.getByLabelText('Bench Press set 1 reps')).toHaveValue(6)
    expect(screen.getByLabelText('Bench Press set 2 lbs')).toHaveValue(175)
    expect(screen.queryByLabelText('Bench Press set 3 lbs')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 2' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Dips set 1 reps')).toHaveValue(10)
  })
})

describe('deleting a workout', () => {
  it('asks for confirmation before deleting', async () => {
    const app = await setup()
    const { user, screen } = app

    await openWorkoutSheet(app, 'Delete')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Push Day' })).toBeInTheDocument()

    await openWorkoutSheet(app, 'Delete')
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Monday's workouts" })).toBeInTheDocument()
    expect(await screen.findByText('Rest day')).toBeInTheDocument()
    expect(screen.queryByText('Push Day')).not.toBeInTheDocument()
  })
})
