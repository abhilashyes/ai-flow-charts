import { useEffect, useRef, useState } from 'react'
import { useViewport } from '@xyflow/react'
import { useStore } from '../store'
import { axisLabel } from '../lib/units'

// Width of one time-period column in flow coordinates. A multiple of the snap
// grid (16) so node edges can land cleanly on column boundaries.
export const COLUMN_WIDTH = 192

/**
 * A labeled time axis across the top of the canvas plus full-height column
 * guides. Column 0 (flow x in [0, COLUMN_WIDTH)) is the reference period "D";
 * columns to the right are D+1, D+2…, to the left D-1, D-2…. The whole thing
 * pans and zooms in lockstep with the canvas via the live viewport transform,
 * and relabels when the global time unit changes.
 */
export default function TimeAxis() {
  const { x, zoom } = useViewport()
  const unit = useStore((s) => s.project.timeUnit)
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const colW = COLUMN_WIDTH * zoom
  // Flow x at the left/right screen edges → range of visible columns.
  const leftFlow = -x / zoom
  const rightFlow = (size.w - x) / zoom
  const startCol = Math.floor(leftFlow / COLUMN_WIDTH) - 1
  const endCol = Math.ceil(rightFlow / COLUMN_WIDTH) + 1

  // Guard against pathological ranges when the panel is collapsed / unmeasured.
  const tooDense = colW < 6
  const cols: number[] = []
  if (size.w > 0 && !tooDense && endCol - startCol < 600) {
    for (let k = startCol; k <= endCol; k++) cols.push(k)
  }

  const showLabels = colW >= 34

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Full-height column guide lines */}
      <svg className="absolute inset-0" width={size.w} height={size.h}>
        {cols.map((k) => {
          const sx = x + k * colW
          return (
            <line
              key={k}
              x1={sx}
              y1={0}
              x2={sx}
              y2={size.h}
              stroke="#94a3b8"
              strokeOpacity={0.35}
              strokeDasharray="3 5"
            />
          )
        })}
      </svg>

      {/* Header band with period labels */}
      <div className="absolute inset-x-0 top-0 h-7 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          Timeline
        </div>
        {showLabels &&
          cols.map((k) => {
            const sx = x + k * colW
            const isRef = k === 0
            return (
              <div
                key={k}
                className="absolute top-0 flex h-7 items-center justify-center"
                style={{ left: sx, width: colW }}
              >
                <span
                  className={`truncate rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    isRef
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                      : 'text-slate-500'
                  }`}
                >
                  {axisLabel(unit, k)}
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
