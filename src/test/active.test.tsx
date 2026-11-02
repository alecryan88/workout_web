import { act, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { did, newStore, openWorkoutSheet, plan, renderApp, seedWorkout, setToday, type App } from './harness'
import type { Store } from '../store/types'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  vi.useRealTimers()
})

async function openWorkout(store: Store, name: string, day?: string) {
  const app = await renderApp(store)
  if (day) await app.user.click(await app.screen.findByRole('button', { name: day }))
  await app.user.click(await app.screen.findByRole('link', { name: new RegExp(name) }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

async function pushDay(sets = [plan(8, 185), plan(8, 185)]) {
  setToday('2026-11-04')
  const store = newStore()
  await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', exercises: { 'Bench Press': sets } })
  return store
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

const elapsed = (app: App) => app.screen.getByRole('timer', { name: 'Elapsed time' })

async function backToWeek(app: App) {
  await app.user.click(app.screen.getByRole('button', { name: 'Back to week' }))
  await app.screen.findByRole('heading', { name: /workouts$/ })
}

describe('starting and finishing a workout', () => {
  it('shows the date, starts a timed session and counts the elapsed time', async () => {
    const app = await openWorkout(await pushDay(), 'Push Day')
    const { user, screen } = app

    expect(screen.getByText('Nov 4, 2026')).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
    await advance(65 * 60 * 1000)
    expect(elapsed(app)).toHaveTextContent(/^1:05:0\d$/)
    expect(screen.getByText(/^1:05:0\d$/, { selector: '.meta-line span:not(.visually-hidden)' })).toBeInTheDocument()

    await backToWeek(app)
    expect(await screen.findByRole('link', { name: /Push Day/ })).toHaveTextContent('In progress')
    expect(screen.getByRole('button', { name: 'Wed Nov 4' })).toHaveAccessibleDescription('In progress')
  })

  it('keeps counting correctly after the app reloads', async () => {
    const store = await pushDay()
    const first = await openWorkout(store, 'Push Day')
    await first.user.click(first.screen.getByRole('button', { name: 'Start' }))
    await first.screen.findByRole('button', { name: 'Finish' })
    cleanup()
    window.location.hash = ''

    await advance(10 * 60 * 1000)
    const app = await openWorkout(store, 'Push Day')
    expect(elapsed(app)).toHaveTextContent(/^10:0\d$/)
  })

  it('asks before finishing with unticked sets, then shows the duration', async () => {
    const app = await openWorkout(await pushDay([did(8, 185), plan(8, 185)]), 'Push Day')
    const { user, screen } = app
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await advance(45 * 60 * 1000)

    await user.click(await screen.findByRole('button', { name: 'Finish' }))
    const confirm = within(screen.getByRole('dialog', { name: 'Finish workout?' }))
    expect(confirm.getByText(/1 set isn’t ticked/)).toBeInTheDocument()
    await user.click(confirm.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Finish' }))
    await user.click(screen.getByRole('button', { name: 'Finish anyway' }))
    expect(await screen.findByText(/^45:0\d$/)).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument()
    await advance(60 * 1000)
    expect(screen.getByText(/^45:0\d$/)).toBeInTheDocument()

    await backToWeek(app)
    expect(await screen.findByRole('link', { name: /Push Day/ })).toHaveTextContent(/done/i)
  })

  it('finishes straight away when every set is ticked', async () => {
    const app = await openWorkout(await pushDay([did(8, 185)]), 'Push Day')
    const { user, screen } = app
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(await screen.findByRole('button', { name: 'Finish' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText(/^0:0\d$/)).toBeInTheDocument()
  })

  it('finishes a planned workout without Start and records no duration', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-11-02', name: 'Old Push', exercises: { 'Bench Press': [plan(8, 185)] } })
    const app = await openWorkout(store, 'Old Push', 'Mon Nov 2')
    const { user, screen } = app

    await user.click(screen.getByRole('button', { name: 'Complete Bench Press set 1' }))
    await user.click(screen.getByRole('button', { name: 'Finish' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await screen.findByRole('button', { name: 'Workout actions' })
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument()
    expect(screen.queryByText('Duration')).not.toBeInTheDocument()

    await backToWeek(app)
    expect(await screen.findByRole('link', { name: /Old Push/ })).toHaveTextContent(/done/i)
    expect(screen.getByRole('button', { name: 'Mon Nov 2' })).toHaveAccessibleDescription('All done')
  })

  it('can mark a done workout not done from its menu', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', status: 'done', exercises: { 'Bench Press': [did(8, 185)] } })
    const app = await openWorkout(store, 'Push Day')
    const { screen } = app

    await openWorkoutSheet(app, 'Mark not done')
    expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument()
    await backToWeek(app)
    expect(await screen.findByRole('link', { name: /Push Day/ })).not.toHaveTextContent(/done/i)
  })
})

describe('only one workout in progress', () => {
  it('explains Start on another workout and offers to open the active one', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', exercises: { 'Bench Press': [plan(8, 185)] } })
    await seedWorkout(store, { date: '2026-11-04', name: 'Evening Run' })
    const app = await openWorkout(store, 'Push Day')
    const { user, screen } = app
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await screen.findByRole('button', { name: 'Finish' })

    await backToWeek(app)
    await user.click(await screen.findByRole('link', { name: /Evening Run/ }))
    await user.click(await screen.findByRole('button', { name: 'Start' }))
    const sheet = within(screen.getByRole('dialog', { name: 'Workout in progress' }))
    expect(sheet.getByText(/Finish “Push Day” first/)).toBeInTheDocument()
    await user.click(sheet.getByRole('button', { name: 'Open Push Day' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Push Day' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Elapsed time' })).toBeInTheDocument()
  })

  it('does not show an in-progress workout from an earlier day as missed', async () => {
    setToday('2026-11-04')
    const store = newStore()
    const id = await seedWorkout(store, { date: '2026-11-03', name: 'Late Session' })
    await store.startWorkout(id)
    const { screen } = await renderApp(store)

    expect(await screen.findByRole('button', { name: 'Tue Nov 3' })).toHaveAccessibleDescription('In progress')
  })
})
