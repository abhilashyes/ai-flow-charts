import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel } from './shared'
import type { SupermarketData } from '../types'

/** Supermarket — drawn as the classic open-right "comb" of stacked cells. */
function SupermarketImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SupermarketData
  return (
    <div
      className={`rounded bg-white px-1 py-1 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : ''
      }`}
      style={{ width: 130 }}
    >
      <FourHandles />
      <div className="flex flex-col gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-4 items-center border-2 border-r-0 border-slate-500"
            style={{ borderRadius: 0 }}
          >
            <div className="ml-auto h-full w-2 border-l-2 border-slate-500" />
          </div>
        ))}
      </div>
      <div className="mt-1 text-center text-[10px] font-semibold text-slate-700">
        <EditableLabel id={id} value={d.label} placeholder="Supermarket" />
        <div className="text-[9px] font-normal text-slate-500">Qty: {Number(d.quantity) || 0}</div>
      </div>
    </div>
  )
}
export const SupermarketNode = memo(SupermarketImpl)

/** FIFO lane — a channel with the letters FIFO and an arrow. */
function FifoImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SupermarketData
  return (
    <div
      className={`rounded bg-white px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-slate-300'
      }`}
      style={{ width: 130 }}
    >
      <FourHandles />
      <div className="flex items-center justify-center gap-1 border-y-2 border-slate-400 py-1 text-[11px] font-bold tracking-widest text-slate-600">
        FIFO <span className="text-base">→</span>
      </div>
      <div className="mt-1 text-center text-[10px] font-semibold text-slate-700">
        <EditableLabel id={id} value={d.label} placeholder="FIFO" />
        <div className="text-[9px] font-normal text-slate-500">Max: {Number(d.quantity) || 0}</div>
      </div>
    </div>
  )
}
export const FifoNode = memo(FifoImpl)

/** Safety / buffer stock — triangle-pair badge. */
function SafetyStockImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as SupermarketData
  return (
    <div
      className={`flex flex-col items-center rounded bg-orange-50 px-2 py-1.5 shadow-sm ${
        selected ? 'ring-2 ring-blue-400' : 'ring-1 ring-orange-300'
      }`}
      style={{ width: 120 }}
    >
      <FourHandles />
      <div className="text-lg leading-none text-orange-500">▲▲</div>
      <div className="mt-1 text-center text-[10px] font-semibold text-orange-800">
        <EditableLabel id={id} value={d.label} placeholder="Safety Stock" />
        <div className="text-[9px] font-normal text-orange-600">Qty: {Number(d.quantity) || 0}</div>
      </div>
    </div>
  )
}
export const SafetyStockNode = memo(SafetyStockImpl)
