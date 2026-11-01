import { useEffect, useId, type ReactNode, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  cancelLabel?: string
}

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

export default function Sheet({ open, title, onClose, children, cancelLabel = 'Cancel' }: Props) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="sheet-layer"
      onTouchStart={stopPropagation}
      onTouchMove={stopPropagation}
      onTouchEnd={stopPropagation}
    >
      <button type="button" className="sheet-backdrop" aria-label="Dismiss" tabIndex={-1} onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="sheet-title">
          {title}
        </h2>
        <div className="sheet-content">{children}</div>
        <button type="button" className="sheet-cancel" onClick={onClose}>
          {cancelLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}
