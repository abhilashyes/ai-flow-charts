import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type ReactFlowInstance,
  type Node,
} from '@xyflow/react'
import { useStore } from '../store'
import { nodeTypes } from '../nodes'
import { edgeTypes, EdgeMarkers } from '../edges'
import type { VsmNodeType } from '../types'

// Grid size used for snapping and the background dots. Nodes snap to this grid
// both horizontally and vertically so maps stay neatly aligned and readable.
export const GRID = 16
const SNAP_GRID: [number, number] = [GRID, GRID]

export default function Canvas() {
  const project = useStore((s) => s.project)
  const activeId = project.activeStateId
  const active = project.states.find((s) => s.id === activeId)!
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const addNodeAt = useStore((s) => s.addNodeAt)
  const setSelectedNode = useStore((s) => s.setSelectedNode)

  const wrapper = useRef<HTMLDivElement>(null)
  const rfInstance = useRef<ReactFlowInstance | null>(null)

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/vsm-node') as VsmNodeType
      if (!type || !rfInstance.current) return
      const pos = rfInstance.current.screenToFlowPosition({ x: event.clientX, y: event.clientY })
      // align the drop to the grid for tidy placement
      addNodeAt(type, {
        x: Math.round(pos.x / GRID) * GRID,
        y: Math.round(pos.y / GRID) * GRID,
      })
    },
    [addNodeAt],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedNode(node.id),
    [setSelectedNode],
  )

  return (
    <div ref={wrapper} className="h-full w-full" data-vsm-canvas>
      <EdgeMarkers />
      <ReactFlow
        nodes={active.nodes}
        edges={active.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(inst) => (rfInstance.current = inst)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedNode(null)}
        snapToGrid
        snapGrid={SNAP_GRID}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'push' }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        className="bg-slate-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={GRID} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={miniMapColor} className="!bottom-2 !right-2" />
      </ReactFlow>
    </div>
  )
}

function miniMapColor(node: Node): string {
  switch (node.type) {
    case 'process':
      return '#fde047'
    case 'inventory':
      return '#f87171'
    case 'kaizen':
      return '#f472b6'
    case 'customer':
    case 'supplier':
    case 'productionControl':
      return '#818cf8'
    default:
      return '#cbd5e1'
  }
}
