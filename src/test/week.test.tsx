import { fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

type Screen = Awaited<ReturnType<typeof renderApp>>['screen']

function stripDays(screen: Screen) {
  return screen.getAllByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) / })
}

describe('week view', () => {
  it('opens on the current Monday-to-Sunday week with today selected and marked', async () => {
    setToday('2026-11-04')
    const { screen } = await renderApp(newStore())

    expect(await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()
    expect(stripDays(screen).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Mon Nov 2',
      'Tue Nov 3',
      'Wed Nov 4',
      'Thu Nov 5',
      'Fri Nov 6',
      'Sat Nov 7',
      'Sun Nov 8',
    ])
    const wednesday = screen.getByRole('button', { name: 'Wed Nov 4' })
    expect(wednesday).toHaveAttribute('aria-current', 'date')
    expect(wednesday).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tue Nov 3' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Tue Nov 3' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('heading', { name: "Today's workouts" })).toBeInTheDocument()
  })
  it('lists only the selected day’s workouts in creation order, and shows rest days', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-03', 'Push Day')
    await store.createWorkout('2026-11-03', 'Evening Run')
    await store.createWorkout('2026-11-06', 'Pull Day')
    const { user, screen } = await renderApp(store)

    expect(await screen.findByText('Rest day')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tue Nov 3' }))
    expect(screen.getByRole('heading', { name: "Tuesday's workouts" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tue Nov 3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual([
      expect.stringContaining('Push Day'),
      expect.stringContaining('Evening Run'),
    ])
    expect(screen.queryByText('Rest day')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fri Nov 6' }))
    expect(screen.getByRole('heading', { name: "Friday's workouts" })).toBeInTheDocument()
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual([expect.stringContaining('Pull Day')])
  })
  it('moves between weeks with the arrows, selecting Monday, and jumps back to today', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-09', 'Next Week Legs')
    await store.createWorkout('2026-10-26', 'Last Week Push')
    const { user, screen } = await renderApp(store)

    await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })
    expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(await screen.findByRole('heading', { name: 'Nov 9 – Nov 15' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mon Nov 9' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: "Monday's workouts" })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Next Week Legs/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(await screen.findByRole('heading', { name: 'Oct 26 – Nov 1' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Last Week Push/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wed Nov 4' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: "Today's workouts" })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument()
  })

  it('changes weeks when swiping left and right', async () => {
    setToday('2026-11-04')
    const { screen } = await renderApp(newStore())

    await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })
    const view = screen.getByRole('main')
    fireEvent.touchStart(view, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(view, { changedTouches: [{ clientX: 100 }] })
    expect(await screen.findByRole('heading', { name: 'Nov 9 – Nov 15' })).toBeInTheDocument()

    fireEvent.touchStart(view, { touches: [{ clientX: 100 }] })
    fireEvent.touchEnd(view, { changedTouches: [{ clientX: 300 }] })
    expect(await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()
  })
  it('marks done workouts and past planned workouts as not done', async () => {
    setToday('2026-11-04')
    const store = newStore()
    const done = await store.createWorkout('2026-11-02', 'Done Push')
    await store.setStatus(done, 'done')
    await store.createWorkout('2026-11-02', 'Missed Pull')
    await store.createWorkout('2026-11-04', 'Today Legs')
    const { user, screen } = await renderApp(store)

    expect(await screen.findByRole('link', { name: /Today Legs/ })).not.toHaveTextContent(/done/i)
    await user.click(screen.getByRole('button', { name: 'Mon Nov 2' }))
    expect(await screen.findByRole('link', { name: /Done Push/ })).toHaveTextContent(/done/i)
    expect(screen.getByRole('link', { name: /Missed Pull/ })).toHaveTextContent(/not done/i)
  })

  it('adds a workout to the selected day and opens it', async () => {
    setToday('2026-11-04')
    const { user, screen } = await renderApp(newStore())

    await user.click(await screen.findByRole('button', { name: 'Fri Nov 6' }))
    await user.click(screen.getByRole('button', { name: 'Add workout' }))
    expect(await screen.findByLabelText('Date')).toHaveValue('2026-11-06')
  })

  it('returns from a workout to its week with its day selected', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-12', 'Thursday Legs')
    const { user, screen } = await renderApp(store)

    await user.click(await screen.findByRole('button', { name: 'Next week' }))
    await user.click(await screen.findByRole('button', { name: 'Thu Nov 12' }))
    await user.click(await screen.findByRole('link', { name: /Thursday Legs/ }))
    await user.click(await screen.findByRole('button', { name: 'Back to week' }))

    expect(await screen.findByRole('heading', { name: 'Nov 9 – Nov 15' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thu Nov 12' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: "Thursday's workouts" })).toBeInTheDocument()
  })
})
