import { useState, useMemo } from 'react'
import { ReactFlow, Background, BackgroundVariant, ReactFlowProvider } from '@xyflow/react'
import { useStore } from '../store'
import { nodeTypes } from '../nodes'
import { edgeTypes, EdgeMarkers } from '../edges'
import { computeMetrics, computeDeltas, type MetricDelta } from '../lib/metrics'
import { humanizeDuration } from '../lib/units'
import type { VsmStateMap } from '../types'

export default function CompareView() {
  const project = useStore((s) => s.project)
  const states = project.states

  const [leftId, setLeftId] = useState(states[0]?.id)
  const [rightId, setRightId] = useState(states[1]?.id ?? states[0]?.id)

  const left = states.find((s) => s.id === leftId) ?? states[0]
  const right = states.find((s) => s.id === rightId) ?? states[0]

  const leftMetrics = useMemo(() => computeMetrics(left), [left])
  const rightMetrics = useMemo(() => computeMetrics(right), [right])
  const deltas = useMemo(() => computeDeltas(leftMetrics, rightMetrics), [leftMetrics, rightMetrics])

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden p-3">
        <ComparePane
          title="Current"
          state={left}
          stateId={left.id}
          states={states}
          onSelect={setLeftId}
        />
        <ComparePane
          title="Future"
          state={right}
          stateId={right.id}
          states={states}
          onSelect={setRightId}
        />
      </div>
      <DeltaTable deltas={deltas} leftName={left.name} rightName={right.name} />
    </div>
  )
}

function ComparePane({
  title,
  state,
  stateId,
  states,
  onSelect,
}: {
  title: string
  state: VsmStateMap
  stateId: string
  states: VsmStateMap[]
  onSelect: (id: string) => void
}) {
  const m = computeMetrics(state)
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {title}
          </span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400"
            value={stateId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 text-[11px] text-slate-500">
          <span>
            Lead <b className="text-slate-700">{humanizeDuration(m.leadTime)}</b>
          </span>
          <span>
            PCE <b className="text-blue-600">{m.vaRatio.toFixed(1)}%</b>
          </span>
        </div>
      </div>
      <div className="relative flex-1">
        <ReactFlowProvider>
          <EdgeMarkers />
          <ReactFlow
            nodes={state.nodes}
            edges={state.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            proOptions={{ hideAttribution: true }}
            className="bg-slate-50"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

function DeltaTable({
  deltas,
  leftName,
  rightName,
}: {
  deltas: MetricDelta[]
  leftName: string
  rightName: string
}) {
  return (
    <div className="border-t border-slate-200 bg-white px-3 py-2.5">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        Improvement — {leftName} → {rightName}
      </div>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
            <th className="py-1 font-medium">Metric</th>
            <th className="py-1 text-right font-medium">{leftName}</th>
            <th className="py-1 text-right font-medium">{rightName}</th>
            <th className="py-1 text-right font-medium">Δ Absolute</th>
            <th className="py-1 text-right font-medium">Δ %</th>
          </tr>
        </thead>
        <tbody>
          {deltas.map((d) => (
            <DeltaRow key={d.key} d={d} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeltaRow({ d }: { d: MetricDelta }) {
  const isTime = d.key === 'leadTime' || d.key === 'va'
  const fmt = (v: number) =>
    isTime ? humanizeDuration(v) : d.key === 'vaRatio' ? `${v.toFixed(1)}%` : String(v)

  // Determine if the change is an improvement.
  const improved = d.lowerIsBetter ? d.delta < 0 : d.delta > 0
  const worsened = d.lowerIsBetter ? d.delta > 0 : d.delta < 0
  const tone = improved ? 'text-green-600' : worsened ? 'text-red-600' : 'text-slate-400'
  const arrow = d.delta === 0 ? '—' : d.delta > 0 ? '▲' : '▼'

  const deltaStr = isTime
    ? `${d.delta >= 0 ? '+' : '−'}${humanizeDuration(Math.abs(d.delta))}`
    : d.key === 'vaRatio'
      ? `${d.delta >= 0 ? '+' : ''}${d.delta.toFixed(1)}pp`
      : `${d.delta >= 0 ? '+' : ''}${d.delta}`

  return (
    <tr className="border-t border-slate-100">
      <td className="py-1 font-medium text-slate-600">{d.label}</td>
      <td className="py-1 text-right tabular-nums text-slate-700">{fmt(d.current)}</td>
      <td className="py-1 text-right tabular-nums text-slate-700">{fmt(d.future)}</td>
      <td className={`py-1 text-right font-semibold tabular-nums ${tone}`}>{deltaStr}</td>
      <td className={`py-1 text-right font-semibold tabular-nums ${tone}`}>
        {arrow} {d.percent === 0 ? '0' : `${Math.abs(d.percent).toFixed(0)}%`}
      </td>
    </tr>
  )
}
