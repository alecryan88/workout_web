import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, setToday, type App } from './harness'
import type { Store } from '../store/types'

afterEach(() => {
  vi.useRealTimers()
})

async function seedTemplate(store: Store) {
  const bench = await store.findOrCreateExercise('Bench Press')
  return store.saveTemplate({
    id: null,
    name: 'Push A',
    notes: 'Heavy day',
    exercises: [{ exercise: bench, restSeconds: 180, sets: [{ weight: 185, reps: 5 }, { weight: 185, reps: 5 }] }],
  })
}

async function openTemplate() {
  setToday('2026-11-04')
  const store = newStore()
  await seedTemplate(store)
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: 'Templates' }))
  await app.user.click(await app.screen.findByRole('link', { name: /Push A/ }))
  await app.screen.findByRole('heading', { level: 1, name: 'Push A' })
  return app
}

async function openAddToCalendar(app: App) {
  await app.user.click(app.screen.getByRole('button', { name: 'Template actions' }))
  await app.user.click(app.screen.getByRole('button', { name: 'Add to calendar' }))
  return within(app.screen.getByRole('dialog', { name: 'Add to calendar' }))
}

async function goToWorkouts(app: App) {
  const { user, screen } = app
  await user.click(screen.getByRole('button', { name: 'Close' }))
  await user.click(await screen.findByRole('link', { name: 'Workouts' }))
  await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })
}

async function showWeek(app: App, title: string) {
  while (!app.screen.queryByRole('heading', { name: title })) {
    await app.user.click(app.screen.getByRole('button', { name: 'Next week' }))
  }
}

describe('adding a template to the calendar', () => {
  it('schedules single dates as snapshot workouts', async () => {
    const app = await openTemplate()
    const { user, screen } = app
    const sheet = await openAddToCalendar(app)

    for (const date of ['2026-11-05', '2026-11-12']) {
      await user.type(sheet.getByLabelText('Date to add'), date)
      await user.click(sheet.getByRole('button', { name: 'Add date' }))
    }
    expect(sheet.getByText('Creates 2 workouts')).toBeInTheDocument()
    await user.click(sheet.getByRole('button', { name: 'Schedule' }))
    expect(await sheet.findByRole('status')).toHaveTextContent('Added 2 workouts')
    await user.click(sheet.getByRole('button', { name: 'Close' }))

    await goToWorkouts(app)
    await user.click(screen.getByRole('button', { name: 'Thu Nov 5' }))
    await user.click(await screen.findByRole('link', { name: /Push A/ }))
    expect(await screen.findByLabelText('Bench Press set 2 lbs')).toHaveValue(185)
    expect(screen.getByLabelText('Bench Press set 2 reps')).toHaveValue(5)
    expect(screen.getByRole('button', { name: 'Complete Bench Press set 1' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Add set to Bench Press' })).toHaveTextContent('+ Add Set (3:00)')
    expect(screen.getByText('Heavy day')).toBeInTheDocument()
  })

  it('schedules chosen weekdays for a number of weeks from a start date', async () => {
    const app = await openTemplate()
    const { user, screen } = app
    const sheet = await openAddToCalendar(app)

    await user.click(sheet.getByRole('button', { name: 'Repeat weekly' }))
    await user.click(sheet.getByRole('button', { name: 'Mon' }))
    await user.click(sheet.getByRole('button', { name: 'Thu' }))
    await user.clear(sheet.getByLabelText('Start date'))
    await user.type(sheet.getByLabelText('Start date'), '2026-11-04')
    await user.clear(sheet.getByLabelText('Weeks'))
    await user.type(sheet.getByLabelText('Weeks'), '3')
    expect(sheet.getByText('Creates 5 workouts')).toBeInTheDocument()
    await user.click(sheet.getByRole('button', { name: 'Schedule' }))
    expect(await sheet.findByRole('status')).toHaveTextContent('Added 5 workouts')
    await user.click(sheet.getByRole('button', { name: 'Close' }))

    await goToWorkouts(app)
    const planned = async () =>
      (await screen.findAllByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) / }))
        .filter((b) => b.textContent && /Planned/.test(b.textContent))
        .map((b) => b.getAttribute('aria-label'))
    await screen.findByRole('button', { name: 'Thu Nov 5', description: 'Planned' })
    expect(await planned()).toEqual(['Thu Nov 5'])
    await showWeek(app, 'Nov 9 – Nov 15')
    await screen.findByRole('button', { name: 'Mon Nov 9', description: 'Planned' })
    expect(await planned()).toEqual(['Mon Nov 9', 'Thu Nov 12'])
    await showWeek(app, 'Nov 16 – Nov 22')
    await screen.findByRole('button', { name: 'Mon Nov 16', description: 'Planned' })
    expect(await planned()).toEqual(['Mon Nov 16', 'Thu Nov 19'])
    await showWeek(app, 'Nov 23 – Nov 29')
    expect(await screen.findByText('Rest day')).toBeInTheDocument()
    expect(await planned()).toEqual([])
  })

  it('keeps scheduled workouts unchanged when the template is edited later', async () => {
    const app = await openTemplate()
    const { user, screen } = app
    const sheet = await openAddToCalendar(app)
    await user.type(sheet.getByLabelText('Date to add'), '2026-11-04')
    await user.click(sheet.getByRole('button', { name: 'Add date' }))
    await user.click(sheet.getByRole('button', { name: 'Schedule' }))
    await sheet.findByRole('status')
    await user.click(sheet.getByRole('button', { name: 'Close' }))

    await user.clear(screen.getByLabelText('Bench Press set 1 reps'))
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '3')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('heading', { level: 1, name: 'Templates' })

    await user.click(screen.getByRole('link', { name: 'Workouts' }))
    await user.click(await screen.findByRole('link', { name: /Push A/ }))
    expect(await screen.findByLabelText('Bench Press set 1 reps')).toHaveValue(5)
  })
})

describe('adding a workout from the week view', () => {
  it('asks whether to start from a template or empty', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await seedTemplate(store)
    const app = await renderApp(store)
    const { user, screen } = app

    await user.click(await screen.findByRole('button', { name: 'Fri Nov 6' }))
    await user.click(screen.getByRole('button', { name: 'Add workout' }))
    const choice = within(screen.getByRole('dialog', { name: 'Add workout' }))
    expect(choice.getByRole('button', { name: 'Empty workout' })).toBeInTheDocument()
    await user.click(choice.getByRole('button', { name: 'From template…' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Choose a template' })).getByRole('button', { name: 'Push A' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Push A' })).toBeInTheDocument()
    expect(screen.getByLabelText('Bench Press set 1 lbs')).toHaveValue(185)
    await user.click(screen.getByRole('button', { name: 'Back to week' }))
    expect(await screen.findByRole('heading', { name: "Friday's workouts" })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Push A/ })).toBeInTheDocument()
  })
})
