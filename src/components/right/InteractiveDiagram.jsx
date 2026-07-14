import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { Sparkles } from 'lucide-react'
import { routeGraph } from '../../utils/elkLayout'

// Rectangles = tasks (blue), diamonds = decisions (orange). Every connector uses
// `taxi` routing so it is always drawn with right angles (never diagonal), in a
// left-to-right direction.
const cyStyle = [
  {
    selector: 'node',
    style: {
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
      // Always right-angled routing, left-to-right.
      'curve-style': 'taxi',
      'taxi-direction': 'horizontal',
      'taxi-turn': '50%',
      'taxi-turn-min-distance': 6,
      width: 2,
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
    },
  },
  {
    selector: 'edge[etype = "process-flow"]',
    style: { 'line-color': '#64748b', 'target-arrow-color': '#64748b', 'line-style': 'solid' },
  },
  {
    selector: 'edge[etype = "information-flow"]',
    style: { 'line-color': '#8b5cf6', 'target-arrow-color': '#8b5cf6', 'line-style': 'dashed' },
  },
  // Connectors with a chosen exit and/or entry side are drawn as an explicit
  // right-angle poly-line via segments, pinned to the chosen sides. Always 90°.
  {
    selector: 'edge.orth',
    style: {
      'curve-style': 'segments',
      'edge-distances': 'endpoints',
      'segment-weights': 'data(segW)',
      'segment-distances': 'data(segD)',
      'source-endpoint': 'data(srcEp)',
      'target-endpoint': 'data(tgtEp)',
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
        srcSide: c.srcSide || 'auto',
        tgtSide: c.tgtSide || 'auto',
        label: `${c.refNum} · ${c.modeOfConveyance}\n${c[timeKey]}m`,
      },
    }))

  return { nodes, edges }
}

const GAP = 30 // stub length out of each shape before the connector turns (px)
const ROUTING_CLASSES = 'orth'

const SIDE_META = {
  right: { ep: '50% 0%', dx: 1, dy: 0 },
  left: { ep: '-50% 0%', dx: -1, dy: 0 },
  top: { ep: '0% -50%', dx: 0, dy: -1 },
  bottom: { ep: '0% 50%', dx: 0, dy: 1 },
}

function box(id, positions, shapes) {
  const p = positions?.get(id)
  if (!p) return null
  const diamond = shapes.get(id) === 'diamond'
  return { x: p.x, y: p.y, w: diamond ? 108 : 136, h: diamond ? 108 : 68 }
}

// Resolve an "auto" side to whichever side of `self` faces `other`.
function resolveSide(side, self, other) {
  if (side && side !== 'auto') return side
  const dx = other.x - self.x
  const dy = other.y - self.y
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'bottom' : 'top'
}

/**
 * Build a strictly right-angled poly-line from the source's exit side to the
 * target's entry side and express it as Cytoscape segment weights/distances
 * (relative to the endpoint line). Every segment is horizontal or vertical.
 */
function orthPath(edge, positions, shapes) {
  const s = box(edge.data.source, positions, shapes)
  const t = box(edge.data.target, positions, shapes)
  if (!s || !t) return null
  const sm = SIDE_META[resolveSide(edge.data.srcSide, s, t)]
  const tm = SIDE_META[resolveSide(edge.data.tgtSide, t, s)]

  const S = { x: s.x + (sm.dx * s.w) / 2, y: s.y + (sm.dy * s.h) / 2 } // source border
  const T = { x: t.x + (tm.dx * t.w) / 2, y: t.y + (tm.dy * t.h) / 2 } // target border
  const s1 = { x: S.x + sm.dx * GAP, y: S.y + sm.dy * GAP } // source stub
  const t1 = { x: T.x + tm.dx * GAP, y: T.y + tm.dy * GAP } // target stub

  const sH = sm.dy === 0 // source leaves horizontally
  const tH = tm.dy === 0 // target entered horizontally
  let mids
  if (sH && tH) {
    let mx
    if (sm.dx > 0 && tm.dx > 0) mx = Math.max(s1.x, t1.x)
    else if (sm.dx < 0 && tm.dx < 0) mx = Math.min(s1.x, t1.x)
    else mx = (s1.x + t1.x) / 2
    mids = [{ x: mx, y: s1.y }, { x: mx, y: t1.y }]
  } else if (!sH && !tH) {
    let my
    if (sm.dy > 0 && tm.dy > 0) my = Math.max(s1.y, t1.y)
    else if (sm.dy < 0 && tm.dy < 0) my = Math.min(s1.y, t1.y)
    else my = (s1.y + t1.y) / 2
    mids = [{ x: s1.x, y: my }, { x: t1.x, y: my }]
  } else if (sH && !tH) {
    mids = [{ x: t1.x, y: s1.y }]
  } else {
    mids = [{ x: s1.x, y: t1.y }]
  }

  const wps = [s1, ...mids, t1]
  const dx = T.x - S.x
  const dy = T.y - S.y
  const len2 = dx * dx + dy * dy || 1
  const len = Math.sqrt(len2)
  const w = []
  const d = []
  for (const p of wps) {
    // Fraction along the endpoint line + signed perpendicular offset. Weights are
    // NOT clamped — a waypoint may legitimately project outside [0,1]; clamping
    // would bend it diagonally. Cytoscape honours out-of-range weights.
    const tt = ((p.x - S.x) * dx + (p.y - S.y) * dy) / len2
    const dd = ((p.y - S.y) * dx - (p.x - S.x) * dy) / len
    w.push(tt.toFixed(4))
    d.push(dd.toFixed(2))
  }
  return { srcEp: sm.ep, tgtEp: tm.ep, segW: w.join(' '), segD: d.join(' ') }
}

// A connector with no chosen sides uses plain (auto-orienting) taxi routing;
// otherwise it uses the explicit orthogonal poly-line.
function computeEdge(edge, positions, shapes) {
  const srcAuto = !edge.data.srcSide || edge.data.srcSide === 'auto'
  const tgtAuto = !edge.data.tgtSide || edge.data.tgtSide === 'auto'
  if (srcAuto && tgtAuto) return { classes: '', data: edge.data }
  const path = orthPath(edge, positions, shapes)
  if (!path) return { classes: '', data: edge.data }
  return {
    classes: 'orth',
    data: { ...edge.data, srcEp: path.srcEp, tgtEp: path.tgtEp, segW: path.segW, segD: path.segD },
  }
}

function edgeEl(edge, positions, shapes) {
  const c = computeEdge(edge, positions, shapes)
  return c.classes
    ? { group: 'edges', data: c.data, classes: c.classes }
    : { group: 'edges', data: c.data }
}

/**
 * Recompute every routed connector from the live node positions so they stay
 * strictly axis-parallel while shapes are dragged (only their length changes).
 */
function restyleEdges(cy) {
  const positions = new Map()
  const shapes = new Map()
  cy.nodes().forEach((n) => {
    positions.set(n.id(), n.position())
    shapes.set(n.id(), n.data('shape'))
  })
  cy.edges().forEach((el) => {
    const edge = {
      data: {
        source: el.data('source'),
        target: el.data('target'),
        srcSide: el.data('srcSide'),
        tgtSide: el.data('tgtSide'),
      },
    }
    const c = computeEdge(edge, positions, shapes)
    el.removeClass('orth')
    if (c.classes) {
      el.data('srcEp', c.data.srcEp)
      el.data('tgtEp', c.data.tgtEp)
      el.data('segW', c.data.segW)
      el.data('segD', c.data.segD)
      el.addClass('orth')
    }
  })
}

/**
 * Incremental reconcile (plain add/delete): existing nodes keep their positions;
 * only new nodes get placed off to the side; nothing else moves.
 */
function syncGraph(cy, nodes, edges, positions) {
  const shapes = new Map(nodes.map((n) => [n.data.id, n.data.shape]))
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
      const c = computeEdge(e, positions, shapes)
      el.data('label', e.data.label)
      el.data('etype', e.data.etype)
      el.data('srcSide', e.data.srcSide)
      el.data('tgtSide', e.data.tgtSide)
      el.data('srcEp', c.data.srcEp)
      el.data('tgtEp', c.data.tgtEp)
      el.data('segW', c.data.segW)
      el.data('segD', c.data.segD)
      el.removeClass(ROUTING_CLASSES)
      if (c.classes) el.addClass(c.classes)
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
      pos = { x: maxX + 220, y: minY + offset * 100 }
      offset++
      positions.set(n.data.id, { ...pos })
    }
    return { group: 'nodes', data: n.data, position: { ...pos } }
  })
  if (toAdd.length) cy.add(toAdd)
  if (newEdges.length) cy.add(newEdges.map((e) => edgeEl(e, positions, shapes)))
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

  // Reconcile the graph. `force` re-runs ELK layout (positions) over the view.
  const rebuild = async (force) => {
    const cy = cyRef.current
    if (!cy || cy.destroyed()) return
    const { processes: procs, connectors: conns, nodes: ns, edges: es } = dataRef.current
    const myRun = ++runIdRef.current

    if (force) {
      ns.forEach((n) => positionsRef.current.delete(n.data.id))
      cy.elements().remove()
    }

    const wantNodeIds = new Set(ns.map((n) => n.data.id))
    const carriedOver = cy.nodes().filter((n) => wantNodeIds.has(n.id())).length
    const freshView = carriedOver === 0
    const needLayout = ns.length > 0 && (force || freshView)

    if (needLayout) {
      if (force) setBusy(true)
      const { positions } = await routeGraph(procs, conns)
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
      const shapes = new Map(ns.map((n) => [n.data.id, n.data.shape]))
      es.forEach((e) => cy.add(edgeEl(e, positionsRef.current, shapes)))
      applySelection(cy)
      requestAnimationFrame(() => {
        if (!cy.destroyed()) {
          cy.fit(undefined, 40)
          fittedRef.current = true
        }
      })
      setBusy(false)
    } else {
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

    // Keep U-detour connectors axis-parallel as nodes move (throttled to a frame).
    let raf = 0
    const onMove = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (!cy.destroyed()) restyleEdges(cy)
      })
    }
    cy.on('drag', 'node', onMove)
    cy.on('position', 'node', onMove)

    const ro = new ResizeObserver(() => {
      if (cy.destroyed()) return
      cy.resize()
      if (!fittedRef.current && cy.nodes().length > 0) {
        cy.fit(undefined, 40)
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

  useEffect(() => {
    rebuild(false)
  }, [dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
          title="Re-layout the diagram left-to-right"
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
