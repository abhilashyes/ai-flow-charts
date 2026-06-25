import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
  type EdgeTypes,
} from '@xyflow/react'

// --- Push arrow: thick striped "marching ants" arrow (material is pushed downstream)
function PushEdgeImpl(p: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX: p.sourceX,
    sourceY: p.sourceY,
    sourcePosition: p.sourcePosition,
    targetX: p.targetX,
    targetY: p.targetY,
    targetPosition: p.targetPosition,
    borderRadius: 6,
  })
  return (
    <>
      <BaseEdge
        id={p.id}
        path={path}
        markerEnd="url(#vsm-arrow-push)"
        style={{
          stroke: '#475569',
          strokeWidth: 7,
          strokeDasharray: '10 6',
          animation: 'vsm-march 1s linear infinite',
        }}
      />
    </>
  )
}
export const PushEdge = memo(PushEdgeImpl)

// --- Pull arrow: curved withdrawal arrow with an open-circle tail
function PullEdgeImpl(p: EdgeProps) {
  const [path, lx, ly] = getBezierPath({
    sourceX: p.sourceX,
    sourceY: p.sourceY,
    sourcePosition: p.sourcePosition,
    targetX: p.targetX,
    targetY: p.targetY,
    targetPosition: p.targetPosition,
  })
  return (
    <>
      <BaseEdge id={p.id} path={path} markerEnd="url(#vsm-arrow-pull)" style={{ stroke: '#0f766e', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-600 bg-white"
          style={{ left: p.sourceX, top: p.sourceY, width: 12, height: 12 }}
          title="Withdrawal / pull"
        />
        <PullBadge x={lx} y={ly} />
      </EdgeLabelRenderer>
    </>
  )
}
function PullBadge({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase text-teal-700"
      style={{ left: x, top: y - 10 }}
    >
      pull
    </div>
  )
}
export const PullEdge = memo(PullEdgeImpl)

// --- Manual information flow: thin straight arrow
function ManualInfoEdgeImpl(p: EdgeProps) {
  const [path] = getStraightPath({
    sourceX: p.sourceX,
    sourceY: p.sourceY,
    targetX: p.targetX,
    targetY: p.targetY,
  })
  return (
    <BaseEdge id={p.id} path={path} markerEnd="url(#vsm-arrow-info)" style={{ stroke: '#1e293b', strokeWidth: 1.5 }} />
  )
}
export const ManualInfoEdge = memo(ManualInfoEdgeImpl)

// --- Electronic information flow: lightning / zigzag straight arrow
function ElectronicInfoEdgeImpl(p: EdgeProps) {
  const path = zigzagPath(p.sourceX, p.sourceY, p.targetX, p.targetY)
  return (
    <BaseEdge id={p.id} path={path} markerEnd="url(#vsm-arrow-info)" style={{ stroke: '#1d4ed8', strokeWidth: 1.5 }} />
  )
}
export const ElectronicInfoEdge = memo(ElectronicInfoEdgeImpl)

/** Build a stepped "lightning bolt" path between two points. */
function zigzagPath(sx: number, sy: number, tx: number, ty: number): string {
  const midX = (sx + tx) / 2
  // Horizontal run, vertical zigzag step, horizontal run — reads as the classic
  // electronic-info staircase regardless of direction.
  const dx = (tx - sx) * 0.18
  return [
    `M ${sx} ${sy}`,
    `L ${midX - dx} ${sy}`,
    `L ${midX + dx} ${ty}`,
    `L ${tx} ${ty}`,
  ].join(' ')
}

export const edgeTypes: EdgeTypes = {
  push: PushEdge,
  pull: PullEdge,
  manualInfo: ManualInfoEdge,
  electronicInfo: ElectronicInfoEdge,
}

/** SVG marker defs shared by the edges. Rendered once inside the flow. */
export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker id="vsm-arrow-push" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#475569" />
        </marker>
        <marker id="vsm-arrow-pull" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#0f766e" />
        </marker>
        <marker id="vsm-arrow-info" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8" fill="none" stroke="#1e293b" strokeWidth="1.4" />
        </marker>
      </defs>
    </svg>
  )
}
