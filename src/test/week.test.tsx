import { within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newStore, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

function day(screen: Awaited<ReturnType<typeof renderApp>>['screen'], label: string) {
  return within(screen.getByRole('region', { name: label }))
}

describe('week view', () => {
  it('opens on the current Monday-to-Sunday week with today highlighted', async () => {
    setToday('2026-11-04')
    const { screen } = await renderApp(newStore())

    expect(await screen.findByRole('heading', { name: 'Week of Nov 2' })).toBeInTheDocument()
    const days = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))
    expect(days).toEqual(['Mon Nov 2', 'Tue Nov 3', 'Wed Nov 4', 'Thu Nov 5', 'Fri Nov 6', 'Sat Nov 7', 'Sun Nov 8'])
    expect(screen.getByRole('region', { name: 'Wed Nov 4' })).toHaveAttribute('aria-current', 'date')
    expect(screen.getByRole('region', { name: 'Tue Nov 3' })).not.toHaveAttribute('aria-current')
  })

  it('lists each day’s workouts and shows empty days as rest days', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-03', 'Push Day')
    await store.createWorkout('2026-11-03', 'Evening Run')
    await store.createWorkout('2026-11-06', 'Pull Day')
    await store.createWorkout('2026-11-10', 'Next Week Legs')
    const { screen } = await renderApp(store)

    await screen.findByText('Push Day')
    expect(day(screen, 'Tue Nov 3').getAllByRole('link').map((l) => l.textContent)).toEqual([
      expect.stringContaining('Push Day'),
      expect.stringContaining('Evening Run'),
    ])
    expect(day(screen, 'Fri Nov 6').getByRole('link', { name: /Pull Day/ })).toBeInTheDocument()
    expect(day(screen, 'Mon Nov 2').getByText('Rest')).toBeInTheDocument()
    expect(screen.queryByText('Next Week Legs')).not.toBeInTheDocument()
  })

  it('moves between weeks with arrows and jumps back to this week', async () => {
    setToday('2026-11-04')
    const store = newStore()
    await store.createWorkout('2026-11-10', 'Next Week Legs')
    await store.createWorkout('2026-10-27', 'Last Week Push')
    const { user, screen } = await renderApp(store)

    await screen.findByRole('heading', { name: 'Week of Nov 2' })
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(await screen.findByRole('heading', { name: 'Week of Nov 9' })).toBeInTheDocument()
    expect(await screen.findByText('Next Week Legs')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(await screen.findByRole('heading', { name: 'Week of Oct 26' })).toBeInTheDocument()
    expect(await screen.findByText('Last Week Push')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'This week' }))
    expect(await screen.findByRole('heading', { name: 'Week of Nov 2' })).toBeInTheDocument()
  })

  it('marks done workouts and dims past planned workouts as not done', async () => {
    setToday('2026-11-04')
    const store = newStore()
    const done = await store.createWorkout('2026-11-02', 'Done Push')
    await store.setStatus(done, 'done')
    await store.createWorkout('2026-11-03', 'Missed Pull')
    await store.createWorkout('2026-11-04', 'Today Legs')
    await store.createWorkout('2026-11-06', 'Future Arms')
    const { screen } = await renderApp(store)

    expect(await screen.findByRole('link', { name: /Done Push/ })).toHaveTextContent(/done/i)
    expect(screen.getByRole('link', { name: /Missed Pull/ })).toHaveTextContent(/not done/i)
    expect(screen.getByRole('link', { name: /Today Legs/ })).not.toHaveTextContent(/done/i)
    expect(screen.getByRole('link', { name: /Future Arms/ })).not.toHaveTextContent(/done/i)
  })
})
