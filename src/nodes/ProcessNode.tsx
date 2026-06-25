import { memo } from 'react'
import { NodeResizer, type NodeProps } from '@xyflow/react'
import { FourHandles, EditableLabel, useTimeUnit } from './shared'
import { formatTime, unitShort } from '../lib/units'
import type { ProcessData } from '../types'

function ProcessNodeImpl({ id, data, selected }: NodeProps) {
  const d = data as unknown as ProcessData
  const unit = useTimeUnit()

  const rows: [string, string][] = [
    ['C/T', formatTime(Number(d.cycleTime) || 0, unit)],
    ['C/O', formatTime(Number(d.changeover) || 0, unit)],
    ['Uptime', `${Number(d.uptime) || 0}%`],
    ['Operators', `${Number(d.operators) || 0}`],
    ['Batch', `${Number(d.batchSize) || 0}`],
    ['Shifts', `${Number(d.shifts) || 0}`],
  ]

  return (
    <div
      className={`rounded-md border-2 bg-vsm-process shadow-sm ${
        selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-vsm-processBorder'
      }`}
      style={{ minWidth: 160 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={120}
        handleClassName="handle"
        lineClassName="!border-blue-400"
      />
      <FourHandles />
      {/* Title bar */}
      <div className="border-b-2 border-vsm-processBorder/40 px-2 py-1.5 text-center text-[13px] font-semibold text-amber-900">
        <EditableLabel id={id} value={d.label} placeholder="Process" />
      </div>
      {/* Data box */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-2 py-1.5 text-[10px] leading-tight text-amber-950">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-1">
            <span className="text-amber-700">{k}</span>
            <span className="font-semibold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-vsm-processBorder/30 px-2 pb-1 pt-0.5 text-center text-[9px] uppercase tracking-wide text-amber-600">
        cycle time in {unitShort(unit)} → VA ladder
      </div>
    </div>
  )
}

export default memo(ProcessNodeImpl)
