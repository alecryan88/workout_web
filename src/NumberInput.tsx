import { useEffect, useState } from 'react'

type Props = {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  decimal?: boolean
  placeholder?: string
}

function parse(text: string, decimal: boolean): number | null {
  if (text.trim() === '') return null
  const n = Number(text)
  if (!Number.isFinite(n) || n < 0) return null
  return decimal ? n : Math.round(n)
}

export default function NumberInput({ label, value, onChange, decimal = false, placeholder }: Props) {
  const [draft, setDraft] = useState(value === null ? '' : String(value))

  useEffect(() => {
    setDraft((current) => (parse(current, decimal) === value ? current : value === null ? '' : String(value)))
  }, [value, decimal])

  return (
    <input
      type="number"
      aria-label={label}
      inputMode={decimal ? 'decimal' : 'numeric'}
      step={decimal ? 'any' : 1}
      min={0}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        onChange(parse(e.target.value, decimal))
      }}
    />
  )
}
