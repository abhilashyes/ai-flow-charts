import { useMemo } from 'react'
import { useStore } from '../store'
import { buildLadder, computeMetrics } from '../lib/metrics'
import { formatTime, humanizeDuration } from '../lib/units'

export default function LeadTimeLadder() {
  const project = useStore((s) => s.project)
  const active = project.states.find((s) => s.id === project.activeStateId)!
  const unit = project.timeUnit

  const ladder = useMemo(() => buildLadder(active), [active])
  const metrics = useMemo(() => computeMetrics(active), [active])

  return (
    <div className="flex items-stretch gap-3 border-t border-slate-200 bg-white px-3 py-2">
      {/* Ladder visualization */}
      <div className="flex-1 overflow-hidden">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Lead-Time Ladder
          </span>
          <span className="text-[10px] text-slate-400">
            upper = wait (NVA) · lower = cycle (VA)
          </span>
        </div>
        {ladder.length === 0 ? (
          <div className="flex h-16 items-center justify-center rounded border border-dashed border-slate-200 text-[11px] text-slate-400">
            Add Process boxes and Inventory triangles to build the ladder.
          </div>
        ) : (
          <div className="vsm-scrollbar overflow-x-auto pb-1">
            <Ladder steps={ladder} unit={unit} />
          </div>
        )}
      </div>

      {/* Metrics summary */}
      <div className="grid w-[420px] shrink-0 grid-cols-3 gap-2">
        <Metric label="Lead Time" value={humanizeDuration(metrics.leadTime)} tone="slate" />
        <Metric label="VA Time" value={humanizeDuration(metrics.valueAddedTime)} tone="green" />
        <Metric
          label="VA Ratio (PCE)"
          value={`${metrics.vaRatio.toFixed(metrics.vaRatio < 1 ? 2 : 1)}%`}
          tone="blue"
        />
        <Metric label="NVA Time" value={humanizeDuration(metrics.nonValueAddedTime)} tone="red" />
        <Metric label="Process Steps" value={String(metrics.processCount)} tone="slate" />
        <Metric label="Inventory Pts" value={String(metrics.inventoryCount)} tone="red" />
      </div>
    </div>
  )
}

function Ladder({ steps, unit }: { steps: ReturnType<typeof buildLadder>; unit: ReturnType<typeof useStore.getState>['project']['timeUnit'] }) {
  // Width per step scales a little with magnitude for a more truthful ladder,
  // but stays within readable bounds.
  return (
    <div className="flex h-16 items-stretch" style={{ minWidth: steps.length * 70 }}>
      {steps.map((s) => (
        <div key={s.id} className="flex w-[70px] flex-col justify-end">
          {/* Upper rung = NVA */}
          <div className="flex h-1/2 items-end justify-center">
            {s.kind === 'nva' && (
              <div className="w-full">
                <div className="truncate text-center text-[8px] text-red-500" title={s.label}>
                  {s.label}
                </div>
                <div className="h-3 border-x border-t border-red-400 bg-red-50 text-center text-[8px] font-semibold leading-3 text-red-600">
                  {formatTime(s.seconds, unit, false)}
                </div>
              </div>
            )}
          </div>
          {/* Lower rung = VA */}
          <div className="flex h-1/2 items-start justify-center">
            {s.kind === 'va' && (
              <div className="w-full">
                <div className="h-3 border-x border-b border-green-500 bg-green-50 text-center text-[8px] font-semibold leading-3 text-green-700">
                  {formatTime(s.seconds, unit, false)}
                </div>
                <div className="truncate text-center text-[8px] text-green-600" title={s.label}>
                  {s.label}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const TONE: Record<string, string> = {
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-md border px-2 py-1 ${TONE[tone]}`}>
      <div className="text-[9px] font-medium uppercase tracking-wide opacity-70">{label}</div>
      <div className="truncate text-sm font-bold tabular-nums" title={value}>
        {value}
      </div>
    </div>
  )
}
