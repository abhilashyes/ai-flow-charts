import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { Sparkles, Plus, X } from 'lucide-react'
import { routeGraph } from '../../utils/elkLayout'
import { conveyanceOf } from '../../utils/conveyance'
import { formatTime } from '../../utils/time'

// Width of one timeline column in flow (model) coordinates — a little wider than
// a shape (rectangles are 136 wide) so a shape sits comfortably in a column.
const COLUMN_W = 168

// Model-space x of the centre of timeline column `i` (columns tile from x=0).
const columnCenterX = (i) => (i + 0.5) * COLUMN_W

// Snap a dragged x to the centre of the nearest column, clamped to the columns
// that actually exist (0 .. count-1).
function snapX(x, count) {
  if (count <= 0) return x
  const i = Math.min(count - 1, Math.max(0, Math.round(x / COLUMN_W - 0.5)))
  return columnCenterX(i)
}

// Height of one shape-slot in model coordinates — tall enough for a 108px
// diamond plus breathing room. A lane's height is `rows` × this (drag-resizable).
const LANE_ROW_H = 132
const LANE_MAX_ROWS = 6
const LANE_GUTTER = 92 // px width of the left label gutter (screen space)

const laneRows = (l) => Math.max(1, l?.rows || 1)

// Model-space top y of each lane (lanes tile downward from y=0) + total height.
function laneTops(lanes) {
  const tops = []
  let acc = 0
  for (const l of lanes) {
    tops.push(acc)
    acc += laneRows(l) * LANE_ROW_H
  }
  return { tops, total: acc }
}

// Model-space y of the centre of lane `i` (accounts for variable lane heights).
function laneCenterYForIndex(lanes, i) {
  const { tops } = laneTops(lanes)
  return tops[i] + (laneRows(lanes[i]) * LANE_ROW_H) / 2
}

// Model-space y for a shape in lane `i` at sub-row `row` (clamped to the lane's
// rows). Lets multiple shapes stack vertically within one lane.
function laneSubRowY(lanes, i, row) {
  const { tops } = laneTops(lanes)
  const r = Math.min(laneRows(lanes[i]) - 1, Math.max(0, row || 0))
  return tops[i] + (r + 0.5) * LANE_ROW_H
}

// Nearest lane index for a dragged y, clamped to the existing lanes.
function snapLaneIndexByY(lanes, y) {
  if (lanes.length === 0) return -1
  const { tops } = laneTops(lanes)
  for (let i = 0; i < lanes.length; i++) {
    const bottom = tops[i] + laneRows(lanes[i]) * LANE_ROW_H
    if (y < bottom) return i
  }
  return lanes.length - 1
}

/**
 * Editable timeline header + full-height column guides, synced to the live
 * Cytoscape viewport so columns pan and zoom with the diagram. Column labels are
 * editable; columns can be added/removed.
 */
function TimelineOverlay({ vp, size, timeline, onLabel, onAdd, onAddLeft, onRemove }) {
  const w = COLUMN_W * vp.zoom
  const cols = timeline.map((c, i) => ({ ...c, x: vp.x + i * w }))
  const startX = vp.x
  const endX = vp.x + timeline.length * w
  const editable = Boolean(onLabel) // read-only in comparison panes

  return (
    <>
      {/* Full-height column guide lines */}
      <svg className="pointer-events-none absolute inset-0 z-[4]" width={size.w} height={size.h}>
        {cols.map((c) => (
          <line key={c.id} x1={c.x} y1={0} x2={c.x} y2={size.h} stroke="#cbd5e1" strokeDasharray="4 5" />
        ))}
        <line x1={endX} y1={0} x2={endX} y2={size.h} stroke="#cbd5e1" strokeDasharray="4 5" />
      </svg>

      {/* Header row with (optionally editable) column labels */}
      <div className="absolute inset-x-0 top-0 z-10 h-8 overflow-hidden border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        {cols.map((c) => (
          <div key={c.id} className="group absolute top-0 flex h-8 items-center" style={{ left: c.x, width: w }}>
            {editable ? (
              <input
                value={c.label}
                onChange={(e) => onLabel(c.id, e.target.value)}
                placeholder="Label"
                className="mx-1 h-6 w-full min-w-0 rounded bg-transparent px-1 text-center text-[12px] font-semibold text-slate-600 outline-none transition hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-300"
              />
            ) : (
              <span className="mx-1 w-full truncate px-1 text-center text-[12px] font-semibold text-slate-600">
                {c.label}
              </span>
            )}
            {editable && timeline.length > 1 && (
              <button
                onClick={() => onRemove(c.id)}
                title="Remove column"
                className="absolute right-0 top-0.5 hidden rounded p-0.5 text-slate-300 hover:text-red-500 group-hover:block"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}
        {editable && onAddLeft && (
          <button
            onClick={onAddLeft}
            title="Add column to the left"
            className="absolute top-1 flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
            style={{ left: Math.max(2, startX - 26) }}
          >
            <Plus size={14} />
          </button>
        )}
        {editable && (
          <button
            onClick={onAdd}
            title="Add column to the right"
            className="absolute top-1 flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
            style={{ left: endX + 4 }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </>
  )
}

// Faint alternating lane tints, drawn BEHIND the Cytoscape canvas so shapes keep
// their true colour (the canvas is transparent between nodes).
function LaneBands({ vp, size, lanes }) {
  const { tops } = laneTops(lanes)
  return (
    <svg className="pointer-events-none absolute inset-0 z-0" width={size.w} height={size.h}>
      {lanes.map((l, i) =>
        i % 2 === 1 ? (
          <rect
            key={l.id}
            x={0}
            y={vp.y + tops[i] * vp.zoom}
            width={size.w}
            height={laneRows(l) * LANE_ROW_H * vp.zoom}
            fill="#f1f5f9"
          />
        ) : null,
      )}
    </svg>
  )
}

/**
 * Swim-lane separators + a left gutter of editable lane labels, plus resize
 * handles and add/remove controls. Synced to the viewport so they pan/zoom with
 * the diagram. Read-only (labels shown, no controls) when edit callbacks are
 * absent, e.g. comparison panes. Lane tints are drawn separately by LaneBands.
 */
function LaneOverlay({ vp, size, lanes, onLabel, onAdd, onAddTop, onRemove, onResize }) {
  const { tops, total } = laneTops(lanes)
  const y = (modelY) => vp.y + modelY * vp.zoom
  const rows = lanes.map((l, i) => ({ ...l, top: tops[i], h: laneRows(l) * LANE_ROW_H }))
  const endY = y(total)
  const editable = Boolean(onLabel)

  // Drag a lane's bottom edge to resize; snaps to whole shape-rows (1..MAX).
  const startResize = (lane, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startClientY = e.clientY
    const startRows = laneRows(lane)
    let cur = startRows
    const move = (ev) => {
      const deltaRows = Math.round(((ev.clientY - startClientY) / vp.zoom) / LANE_ROW_H)
      const next = Math.min(LANE_MAX_ROWS, Math.max(1, startRows + deltaRows))
      if (next !== cur) {
        cur = next
        onResize(lane.id, next)
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <>
      {/* Horizontal band separators (thin lines are fine over shapes) */}
      <svg className="pointer-events-none absolute inset-0 z-[3]" width={size.w} height={size.h}>
        {rows.map((r) => (
          <line key={r.id} x1={0} y1={y(r.top)} x2={size.w} y2={y(r.top)} stroke="#e2e8f0" strokeDasharray="4 5" />
        ))}
        {/* faint sub-row dividers so stacking slots are visible in tall lanes */}
        {rows.flatMap((r) =>
          Array.from({ length: laneRows(r) - 1 }, (_, k) => (
            <line
              key={`${r.id}-sub${k}`}
              x1={0}
              y1={y(r.top + (k + 1) * LANE_ROW_H)}
              x2={size.w}
              y2={y(r.top + (k + 1) * LANE_ROW_H)}
              stroke="#eef2f7"
              strokeDasharray="2 6"
            />
          )),
        )}
        <line x1={0} y1={endY} x2={size.w} y2={endY} stroke="#e2e8f0" strokeDasharray="4 5" />
      </svg>

      {/* Left gutter with lane labels + resize handles (pointer-events on chips) */}
      <div className="pointer-events-none absolute inset-0 z-[6]">
        {rows.map((r) => (
          <div key={r.id} className="group absolute" style={{ top: y(r.top), left: 4, width: LANE_GUTTER, height: r.h * vp.zoom }}>
            <div className="flex items-center gap-0.5 pt-1">
              {editable ? (
                <input
                  value={r.label}
                  onChange={(e) => onLabel(r.id, e.target.value)}
                  placeholder="Lane"
                  className="pointer-events-auto w-full truncate rounded bg-white/85 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm outline-none transition hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-300"
                />
              ) : (
                <span className="w-full truncate rounded bg-white/85 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm">
                  {r.label}
                </span>
              )}
              {editable && lanes.length > 1 && (
                <button
                  onClick={() => onRemove(r.id)}
                  title="Remove lane"
                  className="pointer-events-auto ml-0.5 hidden rounded p-0.5 text-slate-300 hover:text-red-500 group-hover:block"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            {/* Resize handle at the lane's bottom edge */}
            {editable && (
              <button
                onPointerDown={(e) => startResize(r, e)}
                title="Drag to resize (snaps to whole shapes)"
                className="pointer-events-auto absolute -bottom-1 left-0 flex h-2 w-full cursor-ns-resize items-center justify-center opacity-0 transition group-hover:opacity-100"
              >
                <span className="h-1 w-8 rounded-full bg-slate-300 group-hover:bg-blue-400" />
              </button>
            )}
          </div>
        ))}
        {editable && onAddTop && (
          <button
            onClick={onAddTop}
            title="Add lane above"
            className="pointer-events-auto absolute flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
            style={{ top: y(0) - 26, left: 4 }}
          >
            <Plus size={14} />
          </button>
        )}
        {editable && (
          <button
            onClick={onAdd}
            title="Add lane below"
            className="pointer-events-auto absolute flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
            style={{ top: endY + 4, left: 4 }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </>
  )
}

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
    // Customer rectangle — same size as a task box, distinct green colour.
    selector: 'node[shape = "customer"]',
    style: {
      shape: 'round-rectangle',
      'background-color': '#dcfce7',
      'border-color': '#16a34a',
      width: 136,
      height: 68,
      'text-max-width': '120px',
    },
  },
  {
    selector: 'edge',
    style: {
      label: 'data(label)',
      'font-size': 9,
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

function buildElements(processes, connectors) {
  const ids = new Set(processes.map((p) => p.id))

  const nodes = processes.map((p) => ({
    data: {
      id: String(p.id),
      shape: p.type === 'diamond' ? 'diamond' : p.type === 'customer' ? 'customer' : 'rectangle',
      laneId: p.laneId ?? null,
      laneRow: p.laneRow ?? 0,
      label: `${p.abnormal ? '🚩 ' : ''}${p.refNum}  ${p.name}\n${formatTime(p.stdTime, p.stdTimeUnit)} · ${p.stdRes} res`,
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
        label: `${c.abnormal ? '🚩 ' : ''}${conveyanceOf(c.modeOfConveyance).glyph}\n${formatTime(c.stdTime, c.stdTimeUnit)}`,
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

export default function InteractiveDiagram({
  processes,
  connectors,
  selected,
  onSelect,
  timeline,
  onColumnLabel,
  onAddColumn,
  onAddColumnStart,
  onRemoveColumn,
  lanes = [],
  onLaneLabel,
  onAddLane,
  onAddLaneTop,
  onRemoveLane,
  onLaneResize,
  onAssignLane,
  onEditRequest,
}) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const positionsRef = useRef(new Map()) // node id -> { x, y }
  const fittedRef = useRef(false)
  const runIdRef = useRef(0)
  const [busy, setBusy] = useState(false)
  const [vp, setVp] = useState({ x: 0, y: 0, zoom: 1 }) // live viewport (pan + zoom)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const timelineRef = useRef(timeline)
  timelineRef.current = timeline
  const lanesRef = useRef(lanes)
  lanesRef.current = lanes
  const onAssignLaneRef = useRef(onAssignLane)
  onAssignLaneRef.current = onAssignLane
  const onEditRequestRef = useRef(onEditRequest)
  onEditRequestRef.current = onEditRequest

  const { nodes, edges } = useMemo(
    () => buildElements(processes, connectors),
    [processes, connectors],
  )
  const dataRef = useRef({ processes, connectors, nodes, edges })
  dataRef.current = { processes, connectors, nodes, edges }
  // Re-run the reconcile when node/edge data OR lane order/heights change (both
  // drive node Y). Lane relabels don't need a re-pin.
  const lanesKey = useMemo(() => lanes.map((l) => `${l.id}:${laneRows(l)}`).join(','), [lanes])
  const dataKey = useMemo(() => JSON.stringify({ nodes, edges, lanesKey }), [nodes, edges, lanesKey])

  const applySelection = (cy) => {
    cy.elements().removeClass('sel')
    const sel = selectedRef.current
    if (sel?.kind === 'process') cy.getElementById(String(sel.id)).addClass('sel')
    if (sel?.kind === 'connector') cy.getElementById(`e${sel.id}`).addClass('sel')
  }

  // Pin every lane-assigned node's Y to its lane's centre (X kept). Unassigned
  // nodes are left where they are. Keeps lanes deterministic across reloads,
  // auto-arrange, and form/drag reassignment.
  const applyLanes = (cy) => {
    const lanes = lanesRef.current
    const order = new Map(lanes.map((l, i) => [l.id, i]))
    if (order.size === 0) return
    dataRef.current.processes.forEach((p) => {
      if (p.laneId == null || !order.has(p.laneId)) return
      const el = cy.getElementById(String(p.id))
      if (el.empty()) return
      const x = el.position('x')
      const y = laneSubRowY(lanes, order.get(p.laneId), p.laneRow ?? 0)
      el.position({ x, y })
      positionsRef.current.set(String(p.id), { x, y })
    })
    restyleEdges(cy)
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
      applyLanes(cy)
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
      applyLanes(cy)
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
    // Manual double-tap detection (Cytoscape has no native double-click): a second
    // tap on the same element within 300ms opens that tile's edit dialog.
    const lastTap = { key: null, t: 0 }
    const handleTap = (kind, id) => {
      onSelectRef.current?.({ kind, id })
      const key = `${kind}:${id}`
      const now = Date.now()
      if (lastTap.key === key && now - lastTap.t < 300) {
        onEditRequestRef.current?.(kind, id)
        lastTap.key = null
      } else {
        lastTap.key = key
        lastTap.t = now
      }
    }
    cy.on('tap', 'node', (evt) => handleTap('process', Number(evt.target.id())))
    cy.on('tap', 'edge', (evt) => handleTap('connector', Number(evt.target.data('cid'))))
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectRef.current?.(null)
        lastTap.key = null
      }
    })
    cy.on('dragfree', 'node', (evt) => {
      // Snap X to the nearest timeline column. For Y: if dropped inside the lane
      // stack, snap to a lane sub-row (shapes stack within a lane); if dropped
      // above or below the stack, leave it outside any lane (free Y).
      const node = evt.target
      const pos = node.position()
      const x = snapX(pos.x, timelineRef.current.length)
      const lanes = lanesRef.current
      let y = pos.y
      let assign // { laneId, laneRow } | undefined = no lanes, don't touch
      if (lanes.length > 0) {
        const { total, tops } = laneTops(lanes)
        if (pos.y < 0 || pos.y >= total) {
          assign = { laneId: null, laneRow: 0 } // outside the lanes
        } else {
          const li = snapLaneIndexByY(lanes, pos.y)
          const row = Math.floor((pos.y - tops[li]) / LANE_ROW_H)
          assign = { laneId: lanes[li].id, laneRow: row }
          y = laneSubRowY(lanes, li, row)
        }
      }
      node.position({ x, y })
      positionsRef.current.set(node.id(), { x, y })
      if (!cy.destroyed()) restyleEdges(cy)
      if (assign) {
        const pid = Number(node.id())
        const proc = dataRef.current.processes.find((p) => p.id === pid)
        if (proc && (proc.laneId !== assign.laneId || (proc.laneRow ?? 0) !== assign.laneRow)) {
          onAssignLaneRef.current?.(pid, assign.laneId, assign.laneRow)
        }
      }
    })

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

    // Track the viewport so the timeline header/guides follow pan & zoom.
    let vpRaf = 0
    const onViewport = () => {
      if (vpRaf) return
      vpRaf = requestAnimationFrame(() => {
        vpRaf = 0
        if (cy.destroyed()) return
        const pan = cy.pan()
        setVp({ x: pan.x, y: pan.y, zoom: cy.zoom() })
      })
    }
    cy.on('render pan zoom', onViewport)

    const ro = new ResizeObserver(() => {
      if (cy.destroyed()) return
      cy.resize()
      const el = containerRef.current
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight })
      if (!fittedRef.current && cy.nodes().length > 0) {
        cy.fit(undefined, 40)
        fittedRef.current = true
      }
    })
    ro.observe(containerRef.current)
    setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })

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

  // Add a timeline column on the LEFT: shift existing content right by one column
  // so it stays aligned with its (now shifted) labels, then prepend the column.
  const handleAddColumnLeft = () => {
    const cy = cyRef.current
    if (cy && !cy.destroyed()) {
      cy.nodes().forEach((n) => {
        const p = n.position()
        const np = { x: p.x + COLUMN_W, y: p.y }
        n.position(np)
        positionsRef.current.set(n.id(), np)
      })
      restyleEdges(cy)
    }
    onAddColumnStart?.()
  }

  return (
    <div className="relative h-full w-full">
      {/* Lane tints render behind the transparent canvas so shapes aren't tinted */}
      {lanes?.length > 0 && <LaneBands vp={vp} size={size} lanes={lanes} />}

      <div ref={containerRef} className="relative z-[1] h-full w-full" />

      {lanes?.length > 0 && (
        <LaneOverlay
          vp={vp}
          size={size}
          lanes={lanes}
          onLabel={onLaneLabel}
          onAdd={onAddLane}
          onAddTop={onAddLaneTop}
          onRemove={onRemoveLane}
          onResize={onLaneResize}
        />
      )}

      {timeline?.length > 0 && (
        <TimelineOverlay
          vp={vp}
          size={size}
          timeline={timeline}
          onLabel={onColumnLabel}
          onAdd={onAddColumn}
          onAddLeft={onAddColumnStart ? handleAddColumnLeft : undefined}
          onRemove={onRemoveColumn}
        />
      )}

      {/* When there are no lanes, offer to add the first one (lanes are opt-in). */}
      {onAddLane && lanes.length === 0 && (
        <button
          onClick={onAddLane}
          title="Add a swim lane"
          className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <Plus size={14} /> Swim lane
        </button>
      )}

      {processes.length > 1 && (
        <button
          onClick={() => rebuild(true)}
          disabled={busy}
          title="Re-layout the diagram left-to-right"
          className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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
