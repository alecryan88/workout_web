import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMAIL, PASSWORD, newStore, renderApp, setToday } from './harness'

afterEach(() => {
  vi.useRealTimers()
})

describe('login', () => {
  it('shows only the login screen when signed out', async () => {
    setToday('2026-11-04')
    const { screen } = await renderApp(newStore(false))

    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /week of/i })).not.toBeInTheDocument()
  })

  it('shows an error for a wrong password', async () => {
    setToday('2026-11-04')
    const { user, screen } = await renderApp(newStore(false))

    await user.type(await screen.findByLabelText('Email'), EMAIL)
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i)
  })

  it('opens the week view after logging in, and returns to login after logging out', async () => {
    setToday('2026-11-04')
    const { user, screen } = await renderApp(newStore(false))

    await user.type(await screen.findByLabelText('Email'), EMAIL)
    await user.type(screen.getByLabelText('Password'), PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('heading', { name: /week of/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })
})
