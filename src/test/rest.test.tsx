import { act, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, plan, renderApp, seedWorkout, setToday, type App } from './harness'

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'vibrate')
})

async function openPushDay() {
  setToday('2026-11-04')
  const store = newStore()
  await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', exercises: { 'Bench Press': [plan(8, 185), plan(8, 185), plan(8, 185)] } })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

async function startedPushDay() {
  const app = await openPushDay()
  await app.user.click(app.screen.getByRole('button', { name: 'Start' }))
  await app.screen.findByRole('button', { name: 'Finish' })
  return app
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const tick = (app: App, set: number) => app.user.click(app.screen.getByRole('button', { name: `Complete Bench Press set ${set}` }))
const restTimer = (app: App) => app.screen.getByRole('button', { name: /^Rest timer/ })
const countdowns = (app: App) => app.screen.queryAllByRole('timer', { name: 'Rest remaining' })

describe('rest time', () => {
  it('shows the rest time between sets and edits it from a divider', async () => {
    const app = await openPushDay()
    const { user, screen } = app
    expect(screen.getByRole('button', { name: 'Add set to Bench Press' })).toHaveTextContent('+ Add Set (2:00)')

    await user.click(screen.getAllByRole('button', { name: 'Rest time for Bench Press: 2:00' })[0])
    const sheet = within(screen.getByRole('dialog', { name: 'Rest time' }))
    await user.click(sheet.getByRole('button', { name: '+15s' }))
    await user.click(sheet.getByRole('button', { name: '+15s' }))
    await user.click(sheet.getByRole('button', { name: '+15s' }))
    await user.click(sheet.getByRole('button', { name: '−15s' }))
    expect(sheet.getByText('2:30')).toBeInTheDocument()
    await user.click(sheet.getByRole('button', { name: 'Done' }))

    expect(screen.getByRole('button', { name: 'Add set to Bench Press' })).toHaveTextContent('+ Add Set (2:30)')
    expect(screen.getAllByRole('button', { name: 'Rest time for Bench Press: 2:30' })).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    await user.click(await screen.findByRole('link', { name: /Push Day/ }))
    expect(await screen.findByRole('button', { name: 'Add set to Bench Press' })).toHaveTextContent('+ Add Set (2:30)')
  })
})

describe('rest countdown', () => {
  it('does not start when ticking a set on a workout that is not in progress', async () => {
    const app = await openPushDay()
    await tick(app, 1)

    expect(countdowns(app)).toHaveLength(0)
    expect(app.screen.queryByRole('button', { name: /^Rest timer/ })).not.toBeInTheDocument()
  })

  it('counts down in the divider below the ticked set and on the timer button', async () => {
    const app = await startedPushDay()
    expect(restTimer(app)).toBeDisabled()

    await tick(app, 1)
    const set1 = within(app.screen.getByTestId('rest after Bench Press set 1'))
    expect(set1.getByRole('timer', { name: 'Rest remaining' })).toHaveTextContent('2:00')
    expect(restTimer(app)).toHaveTextContent('2:00')
    await advance(30_000)
    expect(set1.getByRole('timer', { name: 'Rest remaining' })).toHaveTextContent('1:30')
    expect(restTimer(app)).toHaveTextContent('1:30')

    await tick(app, 2)
    expect(countdowns(app)).toHaveLength(1)
    expect(within(app.screen.getByTestId('rest after Bench Press set 2')).getByRole('timer')).toHaveTextContent('2:00')
  })

  it('adds or subtracts 15 seconds and skips from the timer button', async () => {
    const app = await startedPushDay()
    const { user, screen } = app
    await tick(app, 1)
    await advance(30_000)

    await user.click(restTimer(app))
    const sheet = within(screen.getByRole('dialog', { name: 'Rest timer' }))
    await user.click(sheet.getByRole('button', { name: '+15s' }))
    expect(restTimer(app)).toHaveTextContent('1:45')
    await user.click(sheet.getByRole('button', { name: '−15s' }))
    await user.click(sheet.getByRole('button', { name: '−15s' }))
    expect(restTimer(app)).toHaveTextContent('1:15')
    await user.click(sheet.getByRole('button', { name: 'Skip' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(countdowns(app)).toHaveLength(0)
    expect(restTimer(app)).toBeDisabled()
  })

  it('vibrates and clears when the rest ends', async () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    const app = await startedPushDay()
    await tick(app, 1)

    await advance(119_000)
    expect(vibrate).not.toHaveBeenCalled()
    await advance(2_000)
    expect(vibrate).toHaveBeenCalledTimes(1)
    expect(countdowns(app)).toHaveLength(0)
    expect(within(app.screen.getByTestId('rest after Bench Press set 1')).getByRole('button')).toHaveTextContent('2:00')
  })
})
