import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, seedWorkout, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

async function openWorkout(notes = '') {
  setToday('2026-11-04')
  const store = newStore()
  await seedWorkout(store, { date: '2026-11-04', name: 'Push Day', notes })
  const app = await renderApp(store)
  await app.user.click(await app.screen.findByRole('link', { name: /Push Day/ }))
  await app.screen.findByRole('button', { name: 'Workout actions' })
  return app
}

describe('editor header', () => {
  it('shows the workout name as the title and keeps the details fields out of the page', async () => {
    const { screen } = await openWorkout()

    expect(screen.getByRole('heading', { level: 1, name: 'Push Day' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Workout name')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument()
  })

  it('shows notes under the header only when the workout has them', async () => {
    const { user, screen } = await openWorkout('Pause reps')
    expect(screen.getByText('Pause reps')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Workout actions' }))
    await user.click(screen.getByRole('button', { name: 'Edit details' }))
    await user.clear(screen.getByLabelText('Notes'))
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.queryByText('Pause reps')).not.toBeInTheDocument()
  })

  it('renames the workout from the details sheet', async () => {
    const { user, screen } = await openWorkout()

    await user.click(screen.getByRole('button', { name: 'Workout actions' }))
    await user.click(screen.getByRole('button', { name: 'Edit details' }))
    const name = screen.getByLabelText('Workout name')
    await user.clear(name)
    await user.type(name, 'Pull Day')
    await user.type(screen.getByLabelText('Notes'), 'Slow negatives')
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Pull Day' })).toBeInTheDocument()
    expect(screen.getByText('Slow negatives')).toBeInTheDocument()
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('offers edit details, copy and delete from the actions menu, which can be cancelled', async () => {
    const { user, screen } = await openWorkout()

    await user.click(screen.getByRole('button', { name: 'Workout actions' }))
    const menu = screen.getByRole('dialog', { name: 'Workout actions' })
    expect(menu).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit details' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
