import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel, useTimeUnit } from './shared'
import { formatTime } from '../lib/units'
import type { StoreData } from '../types'

type StoreVariant = 'aTypeStore' | 'bTypeStore' | 'aTypeStoreAbnormal' | 'fixArea'

const TITLES: Record<StoreVariant, string> = {
  aTypeStore: 'A Type Store',
  bTypeStore: 'B Type Store',
  aTypeStoreAbnormal: 'A Store (Abnormal)',
  fixArea: 'Fix Area',
}

/**
 * Store / area symbols from the Genba legend. All count as inventory and feed
 * Non-Value-Added time via their wait time. The variant only changes the glyph:
 *  - aTypeStore: stacked slots (fix area, fix part no.)
 *  - bTypeStore: a single sequenced lane with an arrow (parts in sequence)
 *  - aTypeStoreAbnormal: A-type slots with hatched "abnormal" markers
 *  - fixArea: solid stacked rows (already-fixed staging area)
 */
function StoreNodeImpl({ id, data, selected, variant }: NodeProps & { variant: StoreVariant }) {
  const d = data as unknown as StoreData
  const unit = useTimeUnit()
  const wait = formatTime(Number(d.waitTime) || 0, unit)

  return (
    <div
      className={`rounded-md border-2 bg-white px-1.5 pb-1 pt-1.5 shadow-sm ${
        selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-400'
      }`}
      style={{ width: 150 }}
    >
      <FourHandles />
      <Glyph variant={variant} />
      <div className="mt-1 text-center text-[11px] font-semibold text-slate-700">
        <EditableLabel id={id} value={d.label} placeholder={TITLES[variant]} />
      </div>
      <div className="flex justify-center gap-2 text-[9px] text-slate-500">
        <span>Qty: {Number(d.quantity) || 0}</span>
        <span>
          Wait: <span className="font-semibold">{wait}</span>
        </span>
      </div>
    </div>
  )
}

function Glyph({ variant }: { variant: StoreVariant }) {
  if (variant === 'bTypeStore') {
    // Single sequenced lane with a flow arrow.
    return (
      <div className="flex items-center gap-1 border-2 border-slate-500 px-1 py-1">
        <div className="h-2 flex-1 bg-slate-100" />
        <span className="text-sm leading-none text-slate-600">→</span>
      </div>
    )
  }
  const solid = variant === 'fixArea'
  const abnormal = variant === 'aTypeStoreAbnormal'
  return (
    <div className="relative border-2 border-slate-500">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2.5 ${i < 2 ? 'border-b-2' : ''} ${
            solid ? 'border-slate-500' : 'border-dotted border-slate-400'
          }`}
        />
      ))}
      {abnormal && (
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 30">
          <defs>
            <pattern id="store-hatch" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#f97316" strokeWidth="1.4" />
            </pattern>
          </defs>
          <circle cx="22" cy="9" r="7" fill="url(#store-hatch)" stroke="#ea580c" strokeWidth="1" />
          <circle cx="74" cy="21" r="7" fill="url(#store-hatch)" stroke="#ea580c" strokeWidth="1" />
        </svg>
      )}
    </div>
  )
}

export const ATypeStoreNode = memo((p: NodeProps) => <StoreNodeImpl {...p} variant="aTypeStore" />)
export const BTypeStoreNode = memo((p: NodeProps) => <StoreNodeImpl {...p} variant="bTypeStore" />)
export const ATypeStoreAbnormalNode = memo((p: NodeProps) => (
  <StoreNodeImpl {...p} variant="aTypeStoreAbnormal" />
))
export const FixAreaNode = memo((p: NodeProps) => <StoreNodeImpl {...p} variant="fixArea" />)
