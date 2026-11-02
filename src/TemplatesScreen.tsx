import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from './store/context'
import type { TemplateSummary } from './store/types'

export default function TemplatesScreen() {
  const store = useStore()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    store
      .listTemplates()
      .then(setTemplates)
      .catch(() => setError('Could not load templates. Check your connection.'))
  }, [store])

  return (
    <main className="tab-screen">
      <header className="screen-header">
        <h1>Templates</h1>
        <button type="button" className="chip" aria-label="New template" onClick={() => navigate('/template/new')}>
          + New
        </button>
      </header>
      {error && <p role="alert" className="error">{error}</p>}
      {templates && templates.length === 0 && <p className="rest">No templates yet. Create one, or save a workout as a template.</p>}
      <ul className="template-list" aria-label="Templates">
        {(templates ?? []).map((t) => (
          <li key={t.id}>
            <Link to={`/template/${t.id}`} className="card template-card">
              <span className="workout-name">{t.name}</span>
              <span className="workout-counts">
                {t.exerciseCount} {t.exerciseCount === 1 ? 'exercise' : 'exercises'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
