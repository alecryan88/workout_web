import { within } from '@testing-library/react'
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
    expect(screen.queryByRole('heading', { name: 'Nov 2 – Nov 8' })).not.toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const sheet = screen.getByRole('dialog', { name: 'Settings' })
    await user.click(within(sheet).getByRole('button', { name: 'Log out' }))
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })

  it('can close the settings sheet without logging out', async () => {
    setToday('2026-11-04')
    const { user, screen } = await renderApp(newStore())

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    const sheet = screen.getByRole('dialog', { name: 'Settings' })
    await user.click(within(sheet).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument()
  })

  it('closes the settings sheet when the backdrop is tapped', async () => {
    setToday('2026-11-04')
    const { user, screen } = await renderApp(newStore())

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nov 2 – Nov 8' })).toBeInTheDocument()
  })
})
