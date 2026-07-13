import { useEffect, useMemo, useRef } from 'react'
import cytoscape from 'cytoscape'

// Cytoscape stylesheet. Rectangles = tasks (blue), diamonds = decisions
// (orange). Process-flow edges are solid, information-flow edges dashed.
const cyStyle = [
  {
    selector: 'node',
    style: {
      // Label sits inside the shape, centered.
      label: 'data(label)',
      'text-wrap': 'wrap',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': 9,
      'font-weight': 600,
      'line-height': 1.15,
      color: '#1e293b',
      'border-width': 2,
      'text-outline-color': '#ffffff',
      'text-outline-width': 1,
    },
  },
  {
    selector: 'node[shape = "rectangle"]',
    style: {
      shape: 'round-rectangle',
      'background-color': '#dbeafe',
      'border-color': '#3b82f6',
      width: 136,
      height: 68,
      'text-max-width': '120px',
    },
  },
  {
    selector: 'node[shape = "diamond"]',
    style: {
      shape: 'diamond',
      'background-color': '#ffedd5',
      'border-color': '#f97316',
      width: 108,
      height: 108,
      'text-max-width': '66px',
    },
  },
  {
    selector: 'edge',
    style: {
      label: 'data(label)',
      'font-size': 8,
      'font-weight': 500,
      color: '#475569',
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.9,
      'text-background-padding': 3,
      'text-background-shape': 'roundrectangle',
      // Orthogonal "elbow" routing (right-angle segments), not diagonal lines.
      'curve-style': 'taxi',
      'taxi-direction': 'downward',
      'taxi-turn': '50%',
      'taxi-turn-min-distance': 8,
      width: 2,
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
    },
  },
  {
    selector: 'edge[etype = "process-flow"]',
    style: {
      'line-color': '#64748b',
      'target-arrow-color': '#64748b',
      'line-style': 'solid',
    },
  },
  {
    selector: 'edge[etype = "information-flow"]',
    style: {
      'line-color': '#8b5cf6',
      'target-arrow-color': '#8b5cf6',
      'line-style': 'dashed',
    },
  },
  {
    selector: '.sel',
    style: {
      'border-color': '#2563eb',
      'border-width': 4,
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      'z-index': 999,
    },
  },
]

function buildElements(processes, connectors, mode) {
  const timeKey = mode === 'ideal' ? 'idealTime' : 'stdTime'
  const resKey = mode === 'ideal' ? 'idealRes' : 'stdRes'
  const ids = new Set(processes.map((p) => p.id))

  const nodes = processes.map((p) => ({
    data: {
      id: String(p.id),
      shape: p.type === 'diamond' ? 'diamond' : 'rectangle',
      label: `${p.refNum}  ${p.name}\n${p[timeKey]}m · ${p[resKey]} res`,
    },
  }))

  const edges = connectors
    .filter((c) => ids.has(c.source) && ids.has(c.target))
    .map((c) => ({
      data: {
        id: `e${c.id}`,
        cid: c.id,
        source: String(c.source),
        target: String(c.target),
        etype: c.type,
        label: `${c.refNum} · ${c.modeOfConveyance}\n${c[timeKey]}m`,
      },
    }))

  return { nodes, edges }
}

/**
 * Reconcile the graph incrementally so that adding or deleting one element never
 * reshuffles the rest. Existing nodes keep their positions; only genuinely new
 * nodes get placed; the auto-layout runs only the first time a view is built.
 * Positions (including any the user drags) are remembered in `positions`.
 */
function syncGraph(cy, nodes, edges, positions) {
  const wasEmpty = cy.nodes().length === 0
  const wantNodes = new Set(nodes.map((n) => n.data.id))
  const wantEdges = new Set(edges.map((e) => e.data.id))

  // Remove elements that are gone (keep their stored positions for later return).
  cy.nodes().forEach((n) => {
    if (!wantNodes.has(n.id())) n.remove()
  })
  cy.edges().forEach((e) => {
    if (!wantEdges.has(e.id())) e.remove()
  })

  // Refresh data (labels/type) on elements that still exist — no movement.
  nodes.forEach((n) => {
    const el = cy.getElementById(n.data.id)
    if (el.nonempty()) {
      el.data('label', n.data.label)
      el.data('shape', n.data.shape)
    }
  })
  edges.forEach((e) => {
    const el = cy.getElementById(e.data.id)
    if (el.nonempty()) {
      el.data('label', e.data.label)
      el.data('etype', e.data.etype)
    }
  })

  const newNodes = nodes.filter((n) => cy.getElementById(n.data.id).empty())
  const newEdges = edges.filter((e) => cy.getElementById(e.data.id).empty())

  // Only auto-layout when building a view from scratch and we have no remembered
  // positions for the incoming nodes.
  const needLayout = wasEmpty && newNodes.some((n) => !positions.has(n.data.id))

  if (needLayout) {
    cy.add(newNodes.map((n) => (positions.has(n.data.id) ? { ...n, position: { ...positions.get(n.data.id) } } : n)))
    cy.add(newEdges)
    cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.15, padding: 24, animate: false }).run()
    cy.nodes().forEach((n) => positions.set(n.id(), { ...n.position() }))
  } else {
    // Incremental add: existing nodes untouched; place each new node at its
    // remembered spot, or just off to the side so nothing else moves.
    const pts = cy.nodes().map((n) => n.position())
    const maxX = pts.length ? Math.max(...pts.map((p) => p.x)) : 0
    const minY = pts.length ? Math.min(...pts.map((p) => p.y)) : 0
    let offset = 0
    const toAdd = newNodes.map((n) => {
      let pos = positions.get(n.data.id)
      if (!pos) {
        pos = { x: maxX + 210, y: minY + offset * 96 }
        offset++
        positions.set(n.data.id, { ...pos })
      }
      return { ...n, position: { ...pos } }
    })
    if (toAdd.length) cy.add(toAdd)
    if (newEdges.length) cy.add(newEdges)
  }

  // Fit only when the view first becomes populated (never on in-place edits).
  if (wasEmpty && cy.nodes().length > 0) {
    requestAnimationFrame(() => {
      if (!cy.destroyed()) cy.fit(undefined, 36)
    })
  }
}

export default function InteractiveDiagram({ processes, connectors, mode, selected, onSelect }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const positionsRef = useRef(new Map()) // node id -> { x, y }
  const fittedRef = useRef(false)

  const { nodes, edges } = useMemo(
    () => buildElements(processes, connectors, mode),
    [processes, connectors, mode],
  )
  const dataKey = useMemo(() => JSON.stringify({ nodes, edges }), [nodes, edges])

  // Init once.
  useEffect(() => {
    const cy = cytoscape({
      container: containerRef.current,
      style: cyStyle,
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.25,
      boxSelectionEnabled: false,
      autoungrabify: false,
    })
    cyRef.current = cy
    cy.on('tap', 'node', (evt) => onSelectRef.current?.({ kind: 'process', id: Number(evt.target.id()) }))
    cy.on('tap', 'edge', (evt) => onSelectRef.current?.({ kind: 'connector', id: Number(evt.target.data('cid')) }))
    cy.on('tap', (evt) => {
      if (evt.target === cy) onSelectRef.current?.(null)
    })
    // Remember any manual drag so it survives future updates.
    cy.on('dragfree', 'node', (evt) => positionsRef.current.set(evt.target.id(), { ...evt.target.position() }))

    const ro = new ResizeObserver(() => {
      if (cy.destroyed()) return
      cy.resize()
      // Only auto-fit once (first time the container has a real size); after that
      // keep the user's pan/zoom stable.
      if (!fittedRef.current && cy.nodes().length > 0) {
        cy.fit(undefined, 36)
        fittedRef.current = true
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      cy.destroy()
      cyRef.current = null
    }
  }, [])

  // Reconcile the graph incrementally whenever the data changes.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    syncGraph(cy, nodes, edges, positionsRef.current)
    if (cy.nodes().length > 0) fittedRef.current = true
  }, [dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reflect external selection as a highlight.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.elements().removeClass('sel')
    if (selected?.kind === 'process') cy.getElementById(String(selected.id)).addClass('sel')
    if (selected?.kind === 'connector') cy.getElementById(`e${selected.id}`).addClass('sel')
  }, [selected, dataKey])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {processes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] text-slate-400">No processes in this view yet.</p>
        </div>
      )}
    </div>
  )
}
