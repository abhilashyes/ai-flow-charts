import { useCallback, useRef, useState } from 'react'

/**
 * Two-panel layout with a draggable divider. Left panel defaults to 25% and can
 * be resized between 18% and 45% of the container width.
 */
export default function MainLayout({ left, right }) {
  const containerRef = useRef(null)
  const [leftPct, setLeftPct] = useState(25)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(45, Math.max(18, pct)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1">
      <div style={{ width: `${leftPct}%` }} className="min-w-0 shrink-0">
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="group relative w-1.5 shrink-0 cursor-col-resize bg-slate-200 transition hover:bg-blue-300"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
      <div style={{ width: `${100 - leftPct}%` }} className="min-w-0 flex-1">
        {right}
      </div>
    </div>
  )
}
