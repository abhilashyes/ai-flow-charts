import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel } from './shared'
import type { SimpleLabelData } from '../types'

/** Customer / Supplier — the classic "factory" box with a sawtooth roof. */
function FactoryBox({
  id,
  data,
  selected,
  kind,
}: NodeProps & { kind: 'customer' | 'supplier' }) {
  const d = data as unknown as SimpleLabelData
  return (
    <div
      className={`rounded-md border-2 bg-vsm-entity shadow-sm ${
        selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-vsm-entityBorder'
      }`}
      style={{ width: 150 }}
    >
      <FourHandles />
      {/* sawtooth roof */}
      <svg viewBox="0 0 150 14" className="block w-full" height={14}>
        <path
          d="M0 14 L15 2 L30 14 L45 2 L60 14 L75 2 L90 14 L105 2 L120 14 L135 2 L150 14"
          fill="none"
          stroke="#4f46e5"
          strokeWidth={1.5}
        />
      </svg>
      <div className="px-2 pb-2 pt-0.5 text-center">
        <div className="text-[9px] font-medium uppercase tracking-wide text-indigo-500">
          {kind === 'customer' ? 'Customer' : 'Supplier'}
        </div>
        <div className="text-[13px] font-semibold text-indigo-900">
          <EditableLabel id={id} value={d.label} placeholder={kind === 'customer' ? 'Customer' : 'Supplier'} />
        </div>
      </div>
    </div>
  )
}

export const CustomerNode = memo((p: NodeProps) => <FactoryBox {...p} kind="customer" />)
export const SupplierNode = memo((p: NodeProps) => <FactoryBox {...p} kind="supplier" />)

/** Production Control — central scheduling box. */
function ProductionControlImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  return (
    <div
      className={`rounded-md border-2 bg-vsm-control px-3 py-2 text-center shadow-sm ${
        selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-vsm-controlBorder'
      }`}
      style={{ width: 150 }}
    >
      <FourHandles />
      <div className="text-[9px] font-medium uppercase tracking-wide text-green-600">Control</div>
      <div className="text-[13px] font-semibold text-green-900">
        <EditableLabel id={id} value={d.label} placeholder="Production Control" />
      </div>
    </div>
  )
}
export const ProductionControlNode = memo(ProductionControlImpl)

/** Truck / shipment icon. */
function TruckImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SimpleLabelData
  return (
    <div
      className={`flex flex-col items-center rounded-md bg-white px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-slate-300'
      }`}
      style={{ width: 110 }}
    >
      <FourHandles />
      <svg width="56" height="28" viewBox="0 0 56 28" className="text-slate-700">
        <rect x="1" y="6" width="30" height="14" rx="1" fill="#cbd5e1" stroke="currentColor" />
        <path d="M31 9 H44 L52 15 V20 H31 Z" fill="#94a3b8" stroke="currentColor" />
        <circle cx="11" cy="22" r="4" fill="#475569" stroke="currentColor" />
        <circle cx="44" cy="22" r="4" fill="#475569" stroke="currentColor" />
      </svg>
      <div className="text-center text-[10px] font-semibold text-slate-700">
        <EditableLabel id={id} value={d.label} placeholder="Shipment" />
      </div>
    </div>
  )
}
export const TruckNode = memo(TruckImpl)
