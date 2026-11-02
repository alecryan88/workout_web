import { useEffect, useId, useState, type FormEvent } from 'react'
import { useStore } from './store/context'
import { displayName, type Exercise } from './store/types'

type Props = { onPick: (exercise: Exercise) => void }

export default function ExercisePicker({ onPick }: Props) {
  const store = useStore()
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<Exercise[]>([])
  const [error, setError] = useState<string | null>(null)
  const listId = useId()

  useEffect(() => {
    let cancelled = false
    if (!text.trim()) {
      setSuggestions([])
      return
    }
    store
      .searchExercises(text)
      .then((list) => !cancelled && setSuggestions(list))
      .catch(() => !cancelled && setSuggestions([]))
    return () => {
      cancelled = true
    }
  }, [store, text])

  const pick = (exercise: Exercise) => {
    setText('')
    setSuggestions([])
    setError(null)
    setAdding(false)
    onPick(exercise)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    try {
      const typed = text.trim().toLowerCase()
      const matches = (await store.searchExercises(text)).filter((e) => e.name.toLowerCase() === typed)
      pick(matches.length === 1 ? matches[0] : await store.findOrCreateExercise(text))
    } catch {
      setError('Could not add exercise. Check your connection.')
    }
  }

  const open = suggestions.length > 0

  if (!adding) {
    return (
      <button type="button" className="card add-exercise" onClick={() => setAdding(true)}>
        + Add exercise
      </button>
    )
  }

  return (
    <form className="exercise-picker" onSubmit={submit}>
      <div className="picker-row">
        <input
          role="combobox"
          aria-label="Add exercise"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus
          autoCapitalize="words"
          placeholder="Add exercise…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="primary" disabled={!text.trim()}>
          Add
        </button>
      </div>
      {open && (
        <ul role="listbox" id={listId} className="suggestions">
          {suggestions.map((s) => (
            <li key={s.id} role="option" aria-selected={false} onClick={() => pick(s)}>
              {displayName(s)}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="error">{error}</p>}
    </form>
  )
}
