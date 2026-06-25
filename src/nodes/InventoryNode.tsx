import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel, useTimeUnit } from './shared'
import { formatTime } from '../lib/units'
import type { InventoryData } from '../types'

function InventoryNodeImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as InventoryData
  const unit = useTimeUnit()
  const wait = formatTime(Number(d.waitTime) || 0, unit)

  return (
    <div className="relative flex flex-col items-center" style={{ width: 120 }}>
      <FourHandles />
      {/* Triangle drawn with CSS borders */}
      <div className="relative">
        <div
          className={`mx-auto h-0 w-0 ${selected ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]' : ''}`}
          style={{
            borderLeft: '46px solid transparent',
            borderRight: '46px solid transparent',
            borderBottom: `74px solid ${selected ? '#ef4444' : '#dc2626'}`,
          }}
        />
        <div
          className="absolute left-1/2 top-[30px] -translate-x-1/2 text-2xl font-bold text-white"
          style={{ lineHeight: 1 }}
        >
          I
        </div>
      </div>
      {/* Label + data */}
      <div className="mt-0.5 w-full text-center text-[11px] font-semibold text-red-800">
        <EditableLabel id={id} value={d.label} placeholder="Inventory" />
      </div>
      <div className="text-center text-[10px] leading-tight text-red-700">
        <div>
          Qty: <span className="font-semibold tabular-nums">{Number(d.quantity) || 0}</span>
        </div>
        <div>
          Wait: <span className="font-semibold tabular-nums">{wait}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(InventoryNodeImpl)
