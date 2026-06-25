import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel } from './shared'
import type { SimpleLabelData, AbnormalData } from '../types'

// ---------------------------------------------------------------------------
// Abnormality markers — a "bowl" that is over-full (overflow) or near-empty
// (shortage). Purely visual flags, not part of the metrics.
// ---------------------------------------------------------------------------
function Bowl({ kind }: { kind: 'overflow' | 'shortage' }) {
  const overflow = kind === 'overflow'
  const color = overflow ? '#dc2626' : '#d97706'
  return (
    <svg width="56" height="48" viewBox="0 0 60 52" className="mx-auto">
      <defs>
        <pattern id={`bowl-${kind}`} width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="5" stroke={color} strokeWidth="1.6" />
        </pattern>
        <clipPath id={`bowl-clip-${kind}`}>
          <path d="M8,16 L14,44 Q30,52 46,44 L52,16 Z" />
        </clipPath>
      </defs>
      {/* contents */}
      <rect
        x="0"
        y={overflow ? 6 : 32}
        width="60"
        height={overflow ? 46 : 20}
        fill={`url(#bowl-${kind})`}
        clipPath={`url(#bowl-clip-${kind})`}
      />
      {/* overflow mound spilling over the rim */}
      {overflow && <path d="M14,16 Q30,2 46,16" fill={`url(#bowl-${kind})`} stroke={color} strokeWidth="1" />}
      {/* bowl outline + rim */}
      <path d="M8,16 L14,44 Q30,52 46,44 L52,16" fill="none" stroke="#475569" strokeWidth="2" />
      <line x1="6" y1="16" x2="54" y2="16" stroke="#475569" strokeWidth="2" />
    </svg>
  )
}

function AbnormalNode({ id, data, selected, kind }: NodeProps & { kind: 'overflow' | 'shortage' }) {
  const d = data as unknown as AbnormalData
  return (
    <div
      className={`flex flex-col items-center rounded-md bg-white px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-slate-300'
      }`}
      style={{ width: 110 }}
    >
      <FourHandles />
      <Bowl kind={kind} />
      <div className={`text-center text-[10px] font-semibold ${kind === 'overflow' ? 'text-red-700' : 'text-amber-700'}`}>
        <EditableLabel id={id} value={d.label} placeholder={kind === 'overflow' ? 'Overflow' : 'Shortage'} />
      </div>
      <div className="text-[8px] uppercase tracking-wide text-slate-400">Abnormal · {kind}</div>
    </div>
  )
}
export const AbnormalOverflowNode = memo((p: NodeProps) => <AbnormalNode {...p} kind="overflow" />)
export const AbnormalShortageNode = memo((p: NodeProps) => <AbnormalNode {...p} kind="shortage" />)

// ---------------------------------------------------------------------------
// Conveyance — material moved by forklift / cart / truck.
// ---------------------------------------------------------------------------
function ConveyanceImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  return (
    <div
      className={`flex flex-col items-center rounded-md bg-white px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-slate-300'
      }`}
      style={{ width: 110 }}
    >
      <FourHandles />
      <svg width="58" height="30" viewBox="0 0 58 30" className="text-slate-700">
        {/* forklift */}
        <rect x="6" y="6" width="18" height="14" rx="1" fill="#cbd5e1" stroke="currentColor" />
        <line x1="24" y1="8" x2="24" y2="24" stroke="currentColor" strokeWidth="1.6" />
        <line x1="24" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="1.6" />
        <rect x="34" y="10" width="12" height="12" fill="#fde68a" stroke="currentColor" />
        <circle cx="11" cy="24" r="4" fill="#475569" stroke="currentColor" />
        <circle cx="20" cy="24" r="4" fill="#475569" stroke="currentColor" />
      </svg>
      <div className="text-center text-[10px] font-semibold text-slate-700">
        <EditableLabel id={id} value={d.label} placeholder="Conveyance" />
      </div>
    </div>
  )
}
export const ConveyanceNode = memo(ConveyanceImpl)

// ---------------------------------------------------------------------------
// Quality check (investigation) — diamond.
// ---------------------------------------------------------------------------
function QualityCheckImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  return (
    <div className="relative flex flex-col items-center" style={{ width: 120 }}>
      <FourHandles />
      <div className="relative flex h-[70px] w-[70px] items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <polygon
            points="50,4 96,50 50,96 4,50"
            fill="#eff6ff"
            stroke={selected ? '#3b82f6' : '#0ea5e9'}
            strokeWidth={selected ? 4 : 2.5}
          />
        </svg>
        <span className="relative z-10 text-xl text-sky-600">✓</span>
      </div>
      <div className="text-center text-[10px] font-semibold text-sky-700">
        <EditableLabel id={id} value={d.label} placeholder="Quality Check" />
      </div>
    </div>
  )
}
export const QualityCheckNode = memo(QualityCheckImpl)

// ---------------------------------------------------------------------------
// Paper instruction ("Tel mail") and Electronic information tiles.
// ---------------------------------------------------------------------------
function PaperInstructionImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  return (
    <div
      className={`rounded-sm bg-white px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-slate-300'
      }`}
      style={{ width: 120 }}
    >
      <FourHandles />
      <div className="flex items-center gap-1.5 border border-slate-300 px-1.5 py-1">
        <span className="text-sm">📄</span>
        <div className="flex-1">
          <div className="h-[2px] w-full bg-slate-300" />
          <div className="mt-1 h-[2px] w-3/4 bg-slate-300" />
        </div>
      </div>
      <div className="mt-1 text-center text-[10px] font-semibold text-slate-700">
        <EditableLabel id={id} value={d.label} placeholder="Paper Instruction" />
      </div>
    </div>
  )
}
export const PaperInstructionNode = memo(PaperInstructionImpl)

function ElectronicInfoImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  return (
    <div
      className={`rounded-sm bg-white px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-slate-300'
      }`}
      style={{ width: 120 }}
    >
      <FourHandles />
      <div className="flex items-center justify-center border border-blue-300 bg-blue-50 py-1.5 text-lg text-blue-600">
        ⚡
      </div>
      <div className="mt-1 text-center text-[10px] font-semibold text-blue-700">
        <EditableLabel id={id} value={d.label} placeholder="Electronic Info" />
      </div>
    </div>
  )
}
export const ElectronicInfoNode = memo(ElectronicInfoImpl)
