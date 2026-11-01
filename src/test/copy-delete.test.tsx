import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, seedWorkout, setToday } from './harness'

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
      'Bench Press': [
        { target: [8, 185], actual: [6, 185] },
        { target: [8, 185], actual: [8, 180] },
      ],
      Dips: [{ target: [12, null], actual: [10, null] }],
    },
  })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByLabelText('Workout name')
  return app
}

type App = Awaited<ReturnType<typeof setup>>

async function copyTo(app: App, dates: string[], actualsAsTargets = false) {
  const { user, screen } = app
  await user.click(screen.getByRole('button', { name: 'Copy workout' }))
  for (const date of dates) {
    await user.type(screen.getByLabelText('Copy to date'), date)
    await user.click(screen.getByRole('button', { name: 'Add date' }))
  }
  if (actualsAsTargets) await user.click(screen.getByLabelText('Use actuals as new targets'))
  const count = dates.length === 1 ? '1 date' : `${dates.length} dates`
  await user.click(screen.getByRole('button', { name: `Copy to ${count}` }))
  expect(await screen.findByText(`Copied to ${count}`)).toBeInTheDocument()
}

async function openOn(app: App, weekOf: string, dayName: string) {
  const { user, screen } = app
  await user.click(screen.getByRole('button', { name: 'Back to week' }))
  await screen.findByRole('heading', { name: 'Week of Nov 2' })
  while (!screen.queryByRole('heading', { name: `Week of ${weekOf}` })) {
    await user.click(screen.getByRole('button', { name: 'Next week' }))
  }
  const day = within(screen.getByRole('region', { name: dayName }))
  const link = await day.findByRole('link', { name: /Push Day/ })
  expect(link).not.toHaveTextContent(/done/i)
  await user.click(link)
  await screen.findByLabelText('Workout name')
}

describe('copying a workout', () => {
  it('copies to several dates as fresh planned workouts with the same plan', async () => {
    const app = await setup()
    await copyTo(app, ['2026-11-09', '2026-11-16'])

    await openOn(app, 'Nov 16', 'Mon Nov 16')
    const { screen } = app
    expect(screen.getByLabelText('Workout name')).toHaveValue('Push Day')
    expect(screen.getByLabelText('Notes')).toHaveValue('Pause reps')
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Bench Press', 'Dips'])
    expect(screen.getByLabelText('Bench Press set 1 target reps')).toHaveValue(8)
    expect(screen.getByLabelText('Bench Press set 2 target weight')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 1 actual reps')).toHaveValue(null)
    expect(screen.getByLabelText('Dips set 1 actual reps')).toHaveValue(null)
    expect(screen.getByRole('button', { name: 'Mark done' })).toBeInTheDocument()

    await app.user.click(screen.getByRole('button', { name: 'Back to week' }))
    await app.user.click(await screen.findByRole('button', { name: 'Previous week' }))
    expect(await within(screen.getByRole('region', { name: 'Mon Nov 9' })).findByRole('link', { name: /Push Day/ })).toBeInTheDocument()
  })

  it('can use the actuals as the new targets', async () => {
    const app = await setup()
    await copyTo(app, ['2026-11-09'], true)

    await openOn(app, 'Nov 9', 'Mon Nov 9')
    const { screen } = app
    expect(screen.getByLabelText('Bench Press set 1 target reps')).toHaveValue(6)
    expect(screen.getByLabelText('Bench Press set 2 target weight')).toHaveValue(180)
    expect(screen.getByLabelText('Dips set 1 target reps')).toHaveValue(10)
    expect(screen.getByLabelText('Bench Press set 1 actual reps')).toHaveValue(null)
  })
})

describe('deleting a workout', () => {
  it('asks for confirmation before deleting', async () => {
    const { user, screen } = await setup()

    await user.click(screen.getByRole('button', { name: 'Delete workout' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Workout name')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete workout' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('heading', { name: 'Week of Nov 2' })).toBeInTheDocument()
    expect(await within(screen.getByRole('region', { name: 'Mon Nov 2' })).findByText('Rest')).toBeInTheDocument()
    expect(screen.queryByText('Push Day')).not.toBeInTheDocument()
  })
})
