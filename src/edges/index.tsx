import { memo } from 'react'
import {
  BaseEdge,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
  type EdgeTypes,
} from '@xyflow/react'

// --- Material flow: solid right-angled arrow with a filled arrowhead.
// Represents physical material moving downstream through the value stream.
function MaterialFlowEdgeImpl(p: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX: p.sourceX,
    sourceY: p.sourceY,
    sourcePosition: p.sourcePosition,
    targetX: p.targetX,
    targetY: p.targetY,
    targetPosition: p.targetPosition,
    borderRadius: 4,
  })
  return (
    <BaseEdge
      id={p.id}
      path={path}
      markerEnd="url(#vsm-arrow-material)"
      style={{ stroke: '#334155', strokeWidth: 2.5 }}
    />
  )
}
export const MaterialFlowEdge = memo(MaterialFlowEdgeImpl)

// --- Information flow: dashed straight arrow with an open arrowhead.
// Represents the flow of information (schedules, instructions) between nodes.
function InformationFlowEdgeImpl(p: EdgeProps) {
  const [path] = getStraightPath({
    sourceX: p.sourceX,
    sourceY: p.sourceY,
    targetX: p.targetX,
    targetY: p.targetY,
  })
  return (
    <BaseEdge
      id={p.id}
      path={path}
      markerEnd="url(#vsm-arrow-info)"
      style={{ stroke: '#1d4ed8', strokeWidth: 1.5, strokeDasharray: '6 4' }}
    />
  )
}
export const InformationFlowEdge = memo(InformationFlowEdgeImpl)

// Only two formal flow arrows are offered. The legacy keys are aliased to the
// closest new renderer so previously exported JSON (which used push / pull /
// manualInfo / electronicInfo) still renders correctly.
export const edgeTypes: EdgeTypes = {
  material: MaterialFlowEdge,
  information: InformationFlowEdge,
  // back-compat aliases
  push: MaterialFlowEdge,
  pull: MaterialFlowEdge,
  manualInfo: InformationFlowEdge,
  electronicInfo: InformationFlowEdge,
}

/** SVG marker defs shared by the edges. Rendered once inside the flow. */
export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="vsm-arrow-material"
          markerWidth="12"
          markerHeight="12"
          refX="9"
          refY="5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#334155" />
        </marker>
        <marker
          id="vsm-arrow-info"
          markerWidth="11"
          markerHeight="11"
          refX="8"
          refY="4"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8" fill="none" stroke="#1d4ed8" strokeWidth="1.4" />
        </marker>
      </defs>
    </svg>
  )
}
