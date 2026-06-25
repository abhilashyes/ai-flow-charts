import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel } from './shared'
import { useStore } from '../store'
import type { SimpleLabelData, AnnotationData } from '../types'

/** Kaizen burst — spiky starburst used to flag future-state improvements. */
function KaizenImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  // 12-point star polygon
  const points = burstPoints(12, 50, 50, 50, 30)
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <FourHandles />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polygon
          points={points}
          fill="#fce7f3"
          stroke={selected ? '#3b82f6' : '#db2777'}
          strokeWidth={selected ? 3 : 2}
        />
      </svg>
      <div className="relative z-10 px-5 text-center text-[10px] font-bold leading-tight text-pink-700">
        <EditableLabel id={id} value={d.label} placeholder="Kaizen" />
      </div>
    </div>
  )
}
export const KaizenNode = memo(KaizenImpl)

function burstPoints(spikes: number, cx: number, cy: number, outer: number, inner: number) {
  const step = Math.PI / spikes
  let pts = ''
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    pts += `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r} `
  }
  return pts.trim()
}

/** Free-text sticky annotation. */
function AnnotationImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as AnnotationData
  const updateNodeData = useStore((s) => s.updateNodeData)
  return (
    <div
      className={`rounded-sm bg-yellow-200 px-2 py-1.5 shadow-md ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-yellow-400'
      }`}
      style={{ width: 150, minHeight: 56 }}
    >
      <FourHandles />
      <div className="text-[10px] font-bold uppercase tracking-wide text-yellow-700">
        <EditableLabel id={id} value={d.label} placeholder="Note" />
      </div>
      <textarea
        className="nodrag mt-0.5 w-full resize-none bg-transparent text-[11px] leading-snug text-yellow-900 outline-none"
        rows={2}
        value={d.text}
        placeholder="Add a note…"
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
      />
    </div>
  )
}
export const AnnotationNode = memo(AnnotationImpl)
