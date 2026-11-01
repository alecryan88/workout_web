import { useState, type FormEvent } from 'react'
import type { Store } from './store/types'

type Props = {
  store: Store
  onSignedIn: () => void
}

export default function Login({ store, onSignedIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await store.signIn(email, password)
      onSignedIn()
    } catch {
      setError('Invalid email or password')
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <h1>Workouts</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          Log in
        </button>
      </form>
    </main>
  )
}
