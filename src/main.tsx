import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { createMemoryStore } from './store/memoryStore'
import { createSupabaseStore } from './store/supabaseStore'
import './styles.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const store =
  url && key
    ? createSupabaseStore(url, key)
    : createMemoryStore({ email: 'demo@example.com', password: 'demo', signedIn: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
)
