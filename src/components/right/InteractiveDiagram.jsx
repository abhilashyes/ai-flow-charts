import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { Sparkles } from 'lucide-react'
import { routeGraph, polylineToSegments } from '../../utils/elkLayout'

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
      // Fallback routing for edges added incrementally (before Auto-arrange).
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
    // Edges routed orthogonally by ELK: follow the computed bend points.
    selector: 'edge.routed',
    style: {
      'curve-style': 'segments',
      'edge-distances': 'node-position',
      'segment-weights': 'data(segW)',
      'segment-distances': 'data(segD)',
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
 * Incremental reconcile (used for plain add/delete): existing nodes keep their
 * positions; only genuinely new nodes get placed; no auto-layout runs. New edges
 * use the taxi fallback until the next Auto-arrange.
 */
function syncGraph(cy, nodes, edges, positions) {
  const wasEmpty = cy.nodes().length === 0
  const wantNodes = new Set(nodes.map((n) => n.data.id))
  const wantEdges = new Set(edges.map((e) => e.data.id))

  cy.nodes().forEach((n) => {
    if (!wantNodes.has(n.id())) n.remove()
  })
  cy.edges().forEach((e) => {
    if (!wantEdges.has(e.id())) e.remove()
  })

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
    return { group: 'nodes', data: n.data, position: { ...pos } }
  })
  if (toAdd.length) cy.add(toAdd)
  if (newEdges.length) cy.add(newEdges.map((e) => ({ group: 'edges', data: e.data })))

  return wasEmpty
}

/** Build an edge element, applying ELK's orthogonal geometry when available. */
function routedEdge(edge, geom, positions) {
  const poly = geom.get(edge.data.id)
  const s = positions.get(edge.data.source)
  const t = positions.get(edge.data.target)
  if (poly && s && t) {
    const seg = polylineToSegments(poly, s, t)
    if (seg) {
      return { group: 'edges', data: { ...edge.data, segW: seg.segW, segD: seg.segD }, classes: 'routed' }
    }
  }
  return { group: 'edges', data: edge.data }
}

export default function InteractiveDiagram({ processes, connectors, mode, selected, onSelect }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const positionsRef = useRef(new Map()) // node id -> { x, y }
  const fittedRef = useRef(false)
  const runIdRef = useRef(0)
  const [busy, setBusy] = useState(false)

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const { nodes, edges } = useMemo(
    () => buildElements(processes, connectors, mode),
    [processes, connectors, mode],
  )
  const dataRef = useRef({ processes, connectors, nodes, edges })
  dataRef.current = { processes, connectors, nodes, edges }
  const dataKey = useMemo(() => JSON.stringify({ nodes, edges }), [nodes, edges])

  const applySelection = (cy) => {
    cy.elements().removeClass('sel')
    const sel = selectedRef.current
    if (sel?.kind === 'process') cy.getElementById(String(sel.id)).addClass('sel')
    if (sel?.kind === 'connector') cy.getElementById(`e${sel.id}`).addClass('sel')
  }

  // Reconcile the graph. `force` re-runs ELK routing over the whole view.
  const rebuild = async (force) => {
    const cy = cyRef.current
    if (!cy || cy.destroyed()) return
    const { processes: procs, connectors: conns, nodes: ns, edges: es } = dataRef.current
    const myRun = ++runIdRef.current

    if (force) {
      ns.forEach((n) => positionsRef.current.delete(n.data.id))
      cy.elements().remove()
    }

    // A "fresh view" is the first render or a full node-set swap (e.g. switching
    // Standard ↔ Ideal): nothing carries over, so run ELK routing + fit. Plain
    // add/delete keeps existing nodes and takes the incremental path.
    const wantNodeIds = new Set(ns.map((n) => n.data.id))
    const carriedOver = cy.nodes().filter((n) => wantNodeIds.has(n.id())).length
    const freshView = carriedOver === 0
    const needRoute = ns.length > 0 && (force || freshView)

    if (needRoute) {
      if (force) setBusy(true)
      const { positions, edges: geom } = await routeGraph(procs, conns)
      if (myRun !== runIdRef.current || cy.destroyed()) {
        if (force) setBusy(false)
        return
      }
      cy.elements().remove()
      ns.forEach((n) => {
        const pos = positions.get(n.data.id) || positionsRef.current.get(n.data.id) || { x: 0, y: 0 }
        positionsRef.current.set(n.data.id, { ...pos })
        cy.add({ group: 'nodes', data: n.data, position: { ...pos } })
      })
      es.forEach((e) => cy.add(routedEdge(e, geom, positionsRef.current)))
      applySelection(cy)
      requestAnimationFrame(() => {
        if (!cy.destroyed()) {
          cy.fit(undefined, 36)
          fittedRef.current = true
        }
      })
      setBusy(false)
    } else {
      // Incremental add/delete: existing nodes stay put, no re-fit.
      syncGraph(cy, ns, es, positionsRef.current)
      applySelection(cy)
      if (cy.nodes().length > 0) fittedRef.current = true
    }
  }

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
    cy.on('dragfree', 'node', (evt) => positionsRef.current.set(evt.target.id(), { ...evt.target.position() }))

    const ro = new ResizeObserver(() => {
      if (cy.destroyed()) return
      cy.resize()
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

  // Reconcile whenever the data changes.
  useEffect(() => {
    rebuild(false)
  }, [dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reflect external selection as a highlight.
  useEffect(() => {
    const cy = cyRef.current
    if (cy && !cy.destroyed()) applySelection(cy)
  }, [selected, dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {processes.length > 1 && (
        <button
          onClick={() => rebuild(true)}
          disabled={busy}
          title="Re-route all connectors orthogonally around the shapes"
          className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Sparkles size={14} className={busy ? 'animate-pulse' : ''} />
          {busy ? 'Arranging…' : 'Auto-arrange'}
        </button>
      )}

      {processes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] text-slate-400">No processes in this view yet.</p>
        </div>
      )}
    </div>
  )
}
