import type { ReactNode } from 'react'
import { monthDay } from './dates'

type Props = {
  monday: string
  sunday: string
  showToday: boolean
  onToday: () => void
  onPrevious: () => void
  onNext: () => void
  trailing: ReactNode
}

export default function WeekHeader({ monday, sunday, showToday, onToday, onPrevious, onNext, trailing }: Props) {
  return (
    <header className="week-header">
      <div className="week-toolbar">
        <div className="toolbar-slot">
          {showToday && (
            <button type="button" className="link-button" onClick={onToday}>
              Today
            </button>
          )}
        </div>
        <div className="toolbar-slot end">{trailing}</div>
      </div>
      <div className="week-title">
        <button type="button" className="icon" aria-label="Previous week" onClick={onPrevious}>
          ‹
        </button>
        <h1>
          {monthDay(monday)} – {monthDay(sunday)}
        </h1>
        <button type="button" className="icon" aria-label="Next week" onClick={onNext}>
          ›
        </button>
      </div>
    </header>
  )
}
