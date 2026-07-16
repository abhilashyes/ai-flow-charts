import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { Plus, X } from 'lucide-react'
import { conveyanceOf } from '../../utils/conveyance'
import { formatTime } from '../../utils/time'
import { COLUMN_W, DEFAULT_LANE_H, LANE_COLORS } from '../../utils/constants'
import { cyShapeStyles, shapeOf } from '../../utils/shapes'
import { abnormalityOf, abnormalityType } from '../../utils/abnormality'

// Model-space x of the centre of timeline column `i` (columns tile from x=0).
const columnCenterX = (i) => (i + 0.5) * COLUMN_W

// px; only pull to a column centre when a shape is released this close to one.
const SNAP_X_THRESHOLD = 24

// Magnetic X snap: pull to the nearest column centre only when released close to
// it — otherwise the shape keeps its dropped x, so shapes can be placed freely
// anywhere, including between columns or to the right of the last one.
function snapX(x, count) {
  if (count <= 0) return x
  const i = Math.min(count - 1, Math.max(0, Math.round(x / COLUMN_W - 0.5)))
  const center = columnCenterX(i)
  return Math.abs(center - x) <= SNAP_X_THRESHOLD ? center : x
}

const LANE_GUTTER = 92 // px width of the left label gutter (screen space)
const laneHeight = (l) => Math.max(60, l?.height || DEFAULT_LANE_H)

// Model-space top y of each lane (lanes tile downward from y=0) + total height.
// Lanes are purely visual bands now — they don't constrain shape positions.
function laneTops(lanes) {
  const tops = []
  let acc = 0
  for (const l of lanes) {
    tops.push(acc)
    acc += laneHeight(l)
  }
  return { tops, total: acc }
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

// Per-lane subtle colour bands, drawn BEHIND the Cytoscape canvas so shapes keep
// their true colour (the canvas is transparent between nodes). Each lane's colour
// is chosen by the user; missing colours fall back to the palette by index.
function LaneBands({ vp, size, lanes }) {
  const { tops } = laneTops(lanes)
  return (
    <svg className="pointer-events-none absolute inset-0 z-0" width={size.w} height={size.h}>
      {lanes.map((l, i) => (
        <rect
          key={l.id}
          x={0}
          y={vp.y + tops[i] * vp.zoom}
          width={size.w}
          height={laneHeight(l) * vp.zoom}
          fill={l.color ?? LANE_COLORS[i % LANE_COLORS.length]}
        />
      ))}
    </svg>
  )
}

/**
 * Swim-lane separators + a left gutter of editable lane labels, plus resize
 * handles and add/remove controls. Synced to the viewport so they pan/zoom with
 * the diagram. Read-only (labels shown, no controls) when edit callbacks are
 * absent, e.g. comparison panes. Lane tints are drawn separately by LaneBands.
 */
function LaneOverlay({ vp, size, lanes, onLabel, onAdd, onAddTop, onRemove, onResize, onLaneColor }) {
  const { tops, total } = laneTops(lanes)
  const y = (modelY) => vp.y + modelY * vp.zoom
  const rows = lanes.map((l, i) => ({ ...l, top: tops[i], h: laneHeight(l) }))
  const endY = y(total)
  const editable = Boolean(onLabel)
  const [pickerFor, setPickerFor] = useState(null) // lane id whose colour picker is open

  // Drag a lane's bottom edge to resize freely (min height clamp in the hook).
  const startResize = (lane, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startClientY = e.clientY
    const startH = laneHeight(lane)
    const move = (ev) => onResize(lane.id, startH + (ev.clientY - startClientY) / vp.zoom)
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
        <line x1={0} y1={endY} x2={size.w} y2={endY} stroke="#e2e8f0" strokeDasharray="4 5" />
      </svg>

      {/* Left gutter with lane labels + resize handles (pointer-events on chips) */}
      <div className="pointer-events-none absolute inset-0 z-[6]">
        {rows.map((r) => (
          <div key={r.id} className="group absolute" style={{ top: y(r.top), left: 4, width: LANE_GUTTER, height: r.h * vp.zoom }}>
            <div className="flex items-center gap-0.5 pt-1">
              {editable && onLaneColor && (
                <button
                  onClick={() => setPickerFor((cur) => (cur === r.id ? null : r.id))}
                  title="Lane colour"
                  className="pointer-events-auto h-5 w-5 shrink-0 rounded border border-slate-300 shadow-sm"
                  style={{ backgroundColor: r.color ?? LANE_COLORS[0] }}
                />
              )}
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
            {editable && onLaneColor && pickerFor === r.id && (
              <div
                className="pointer-events-auto absolute left-0 top-8 z-[7] flex flex-wrap gap-1 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg"
                style={{ width: 108 }}
              >
                {LANE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onLaneColor(r.id, c)
                      setPickerFor(null)
                    }}
                    title={c}
                    className={`h-5 w-5 rounded border ${
                      (r.color ?? LANE_COLORS[0]) === c ? 'border-slate-500 ring-1 ring-slate-400' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            {/* Resize handle at the lane's bottom edge */}
            {editable && (
              <button
                onPointerDown={(e) => startResize(r, e)}
                title="Drag to resize the lane"
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

// Floating abnormality glyphs (Excess = dome, Shortage = bowl) drawn above each
// flagged process node and connector mid-point. Synced to the viewport so they
// pan/zoom/track with the shapes; never overlap them (a gap is kept). Read-only.
const ABN_BASE_PX = 22 // glyph size at zoom 1
const ABN_GAP = 14 // model-space gap between the glyph's bottom and the shape
const ABN_EDGE_LIFT = 13 // model-space lift of the glyph above a connector mid-point

function AbnormalityOverlay({ vp, size, processes, connectors }) {
  const posById = new Map(processes.map((p) => [p.id, p]))
  const gpx = ABN_BASE_PX * vp.zoom
  const toScreen = (mx, my) => ({ x: vp.x + mx * vp.zoom, y: vp.y + my * vp.zoom })

  const items = []
  for (const p of processes) {
    const a = abnormalityOf(abnormalityType(p))
    if (!a) continue
    const h = shapeOf(p.type).height
    const { x, y } = toScreen(p.x ?? 0, (p.y ?? 0) - h / 2 - ABN_GAP)
    items.push({ key: `p${p.id}`, a, cx: x, bottomY: y })
  }
  for (const c of connectors) {
    const a = abnormalityOf(abnormalityType(c))
    if (!a) continue
    const s = posById.get(c.source)
    const t = posById.get(c.target)
    if (!s || !t) continue
    const mx = ((s.x ?? 0) + (t.x ?? 0)) / 2
    const my = ((s.y ?? 0) + (t.y ?? 0)) / 2
    // If the connector also shows a boxcar (conveyance SVG), stack the glyph
    // above it; otherwise float just above the mid-label.
    const lift = conveyanceOf(c.modeOfConveyance).dataUri ? ABN_EDGE_LIFT + 22 : ABN_EDGE_LIFT
    const { x, y } = toScreen(mx, my - lift)
    items.push({ key: `c${c.id}`, a, cx: x, bottomY: y })
  }
  if (items.length === 0) return null

  return (
    <svg className="pointer-events-none absolute inset-0 z-[4]" width={size.w} height={size.h}>
      {items.map((it) => (
        <image
          key={it.key}
          href={it.a.dataUri}
          width={gpx}
          height={gpx}
          x={it.cx - gpx / 2}
          y={it.bottomY - gpx}
        />
      ))}
    </svg>
  )
}

// Crisp SVG symbols for conveyance modes that carry one (e.g. the symmetrical
// boxcar for Physical Transport), floated just above each connector's mid-label.
const CONV_PX = 20 // symbol size at zoom 1
const CONV_LIFT = 12 // model-space lift above the mid-point

function ConveyanceOverlay({ vp, size, processes, connectors }) {
  const posById = new Map(processes.map((p) => [p.id, p]))
  const gpx = CONV_PX * vp.zoom
  const items = []
  for (const c of connectors) {
    const uri = conveyanceOf(c.modeOfConveyance).dataUri
    if (!uri) continue
    const s = posById.get(c.source)
    const t = posById.get(c.target)
    if (!s || !t) continue
    const cx = vp.x + (((s.x ?? 0) + (t.x ?? 0)) / 2) * vp.zoom
    const bottomY = vp.y + (((s.y ?? 0) + (t.y ?? 0)) / 2 - CONV_LIFT) * vp.zoom
    items.push({ key: `cv${c.id}`, uri, cx, bottomY })
  }
  if (items.length === 0) return null
  return (
    <svg className="pointer-events-none absolute inset-0 z-[4]" width={size.w} height={size.h}>
      {items.map((it) => (
        <image key={it.key} href={it.uri} width={gpx} height={gpx} x={it.cx - gpx / 2} y={it.bottomY - gpx} />
      ))}
    </svg>
  )
}

// Free-floating sticky notes, anchored to a model position (so they pan with the
// diagram) at a fixed pixel size (so text stays readable at any zoom). Editable
// panes can drag (via the header), edit the text, and delete; read-only panes
// just show the text.
const NOTE_W = 172

function NotesOverlay({ vp, size, notes, onText, onMove, onRemove }) {
  const editable = Boolean(onText)
  const startDrag = (note, e) => {
    if (!onMove) return
    e.preventDefault()
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    const move = (ev) =>
      onMove(note.id, Math.round(note.x + (ev.clientX - sx) / vp.zoom), Math.round(note.y + (ev.clientY - sy) / vp.zoom))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {notes.map((n) => (
        <div
          key={n.id}
          className="group/note pointer-events-auto absolute overflow-hidden rounded-md border border-amber-300 bg-amber-100 shadow-md"
          style={{ left: vp.x + n.x * vp.zoom, top: vp.y + n.y * vp.zoom, width: NOTE_W }}
        >
          <div
            onPointerDown={editable ? (e) => startDrag(n, e) : undefined}
            className={`flex items-center justify-between bg-amber-200/70 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ${editable ? 'cursor-move' : ''}`}
          >
            <span>Note</span>
            {editable && (
              <button onClick={() => onRemove(n.id)} title="Delete note" className="rounded p-0.5 text-amber-700 hover:bg-amber-300 hover:text-red-600">
                <X size={11} />
              </button>
            )}
          </div>
          {editable ? (
            <textarea
              value={n.text}
              onChange={(e) => onText(n.id, e.target.value)}
              placeholder="Type a note…"
              rows={3}
              className="block w-full resize-none bg-amber-100 px-2 py-1.5 text-[12px] text-slate-700 outline-none placeholder:text-amber-600/60"
            />
          ) : (
            <div className="whitespace-pre-wrap px-2 py-1.5 text-[12px] text-slate-700">{n.text}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// Dashed group boxes. The box is a visual boundary (moves on its own — shapes
// stay put); it is "aware" of its members by geometry: any process whose centre
// falls inside the box. The count is shown on the label chip. Editable panes can
// move (drag the label), resize (corner handle), rename, and delete.
function groupMembers(group, processes) {
  return processes.filter(
    (p) => (p.x ?? 0) >= group.x && (p.x ?? 0) <= group.x + group.w && (p.y ?? 0) >= group.y && (p.y ?? 0) <= group.y + group.h,
  )
}

function GroupOverlay({ vp, size, groups, processes, onLabel, onRect, onRemove }) {
  const editable = Boolean(onLabel)
  const drag = (start, apply) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    const move = (ev) => apply((ev.clientX - sx) / vp.zoom, (ev.clientY - sy) / vp.zoom)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {groups.map((g) => {
        const left = vp.x + g.x * vp.zoom
        const top = vp.y + g.y * vp.zoom
        const members = groupMembers(g, processes)
        return (
          <div
            key={g.id}
            className="absolute rounded-lg border-2 border-dashed border-slate-400"
            style={{ left, top, width: g.w * vp.zoom, height: g.h * vp.zoom }}
          >
            <div
              onPointerDown={editable ? drag(g, (dx, dy) => onRect(g.id, { x: Math.round(g.x + dx), y: Math.round(g.y + dy) })) : undefined}
              className={`pointer-events-auto absolute -top-3 left-2 flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 shadow-sm ring-1 ring-slate-200 ${editable ? 'cursor-move' : ''}`}
              title={members.map((m) => m.refNum).join(', ') || 'No shapes inside'}
            >
              {editable ? (
                <input
                  value={g.label}
                  onChange={(e) => onLabel(g.id, e.target.value)}
                  placeholder="Group"
                  className="w-24 bg-transparent text-[11px] font-semibold text-slate-600 outline-none"
                />
              ) : (
                <span className="text-[11px] font-semibold text-slate-600">{g.label}</span>
              )}
              <span className="rounded-full bg-slate-700 px-1.5 text-[10px] font-bold text-white" title={`${members.length} shape(s) inside`}>
                {members.length}
              </span>
              {editable && (
                <button onClick={() => onRemove(g.id)} title="Delete group" className="rounded p-0.5 text-slate-300 hover:text-red-500">
                  <X size={11} />
                </button>
              )}
            </div>
            {editable && (
              <button
                onPointerDown={drag(g, (dx, dy) => onRect(g.id, { w: Math.max(80, Math.round(g.w + dx)), h: Math.max(60, Math.round(g.h + dy)) }))}
                title="Drag to resize the group"
                className="pointer-events-auto absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-slate-400 bg-white shadow-sm"
              />
            )}
          </div>
        )
      })}
    </div>
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
  // Per-shape style blocks generated from the shape registry (utils/shapes.js).
  ...cyShapeStyles(),
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
      // Registry value; shapeOf() falls back to 'rectangle' for unknown/legacy.
      shape: shapeOf(p.type).value,
      label: `${p.refNum}  ${p.name}\n${formatTime(p.stdTime, p.stdTimeUnit)} · ${p.stdRes} res`,
    },
  }))

  const edges = connectors
    .filter((c) => ids.has(c.source) && ids.has(c.target))
    .map((c) => {
      // Modes with a crisp SVG (e.g. Physical Transport) are drawn by
      // ConveyanceOverlay, so the text label shows only the time (no emoji).
      const glyph = conveyanceOf(c.modeOfConveyance).glyph
      const time = formatTime(c.stdTime, c.stdTimeUnit)
      return {
        data: {
          id: `e${c.id}`,
          cid: c.id,
          source: String(c.source),
          target: String(c.target),
          etype: c.type,
          srcSide: c.srcSide || 'auto',
          tgtSide: c.tgtSide || 'auto',
          label: glyph ? `${glyph}\n${time}` : time,
        },
      }
    })

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
  const s = shapeOf(shapes.get(id))
  return { x: p.x, y: p.y, w: s.width, h: s.height }
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
  onLaneColor,
  notes = [],
  groups = [],
  onAddNote,
  onNoteText,
  onNoteMove,
  onNoteRemove,
  onAddGroup,
  onGroupLabel,
  onGroupRect,
  onGroupRemove,
  onMoveNode,
  onEditRequest,
}) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const fittedRef = useRef(false)
  const [vp, setVp] = useState({ x: 0, y: 0, zoom: 1 }) // live viewport (pan + zoom)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const timelineRef = useRef(timeline)
  timelineRef.current = timeline
  const onMoveNodeRef = useRef(onMoveNode)
  onMoveNodeRef.current = onMoveNode
  const onEditRequestRef = useRef(onEditRequest)
  onEditRequestRef.current = onEditRequest

  const { nodes, edges } = useMemo(
    () => buildElements(processes, connectors),
    [processes, connectors],
  )
  const dataRef = useRef({ processes, connectors, nodes, edges })
  dataRef.current = { processes, connectors, nodes, edges }
  // `dataKey` triggers add/remove/label reconcile; `positionsKey` triggers the
  // position-sync effect that places nodes from their saved x,y.
  const dataKey = useMemo(() => JSON.stringify({ nodes, edges }), [nodes, edges])
  const positionsKey = useMemo(
    () => processes.map((p) => `${p.id}:${Math.round(p.x ?? 0)}:${Math.round(p.y ?? 0)}`).join(','),
    [processes],
  )

  const applySelection = (cy) => {
    cy.elements().removeClass('sel')
    const sel = selectedRef.current
    if (sel?.kind === 'process') cy.getElementById(String(sel.id)).addClass('sel')
    if (sel?.kind === 'connector') cy.getElementById(`e${sel.id}`).addClass('sel')
  }

  // Reconcile the graph from the data: add/update/remove nodes & edges, placing
  // each shape at its saved position (positions are the source of truth now).
  const reconcile = () => {
    const cy = cyRef.current
    if (!cy || cy.destroyed()) return
    const { processes: procs, nodes: ns, edges: es } = dataRef.current
    const posMap = new Map(procs.map((p) => [String(p.id), { x: p.x ?? 0, y: p.y ?? 0 }]))
    syncGraph(cy, ns, es, posMap)
    applySelection(cy)
    if (!fittedRef.current && cy.nodes().length > 0) {
      fittedRef.current = true
      requestAnimationFrame(() => {
        if (!cy.destroyed()) cy.fit(undefined, 40)
      })
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
      // X snaps to the nearest timeline column; Y is free. Persist the position.
      const node = evt.target
      const pos = node.position()
      const x = snapX(pos.x, timelineRef.current.length)
      const y = pos.y
      node.position({ x, y })
      if (!cy.destroyed()) restyleEdges(cy)
      onMoveNodeRef.current?.(Number(node.id()), x, y)
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
    reconcile()
  }, [dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync node positions from the data (drags, undo/redo, column-left shift).
  useEffect(() => {
    const cy = cyRef.current
    if (!cy || cy.destroyed()) return
    dataRef.current.processes.forEach((p) => {
      const el = cy.getElementById(String(p.id))
      if (el.nonempty() && p.x != null && p.y != null) el.position({ x: p.x, y: p.y })
    })
    restyleEdges(cy)
  }, [positionsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cy = cyRef.current
    if (cy && !cy.destroyed()) applySelection(cy)
  }, [selected, dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full">
      {/* Lane tints render behind the transparent canvas so shapes aren't tinted */}
      {lanes?.length > 0 && <LaneBands vp={vp} size={size} lanes={lanes} />}

      <div ref={containerRef} className="relative z-[1] h-full w-full" />

      {groups?.length > 0 && (
        <GroupOverlay
          vp={vp}
          size={size}
          groups={groups}
          processes={processes}
          onLabel={onGroupLabel}
          onRect={onGroupRect}
          onRemove={onGroupRemove}
        />
      )}

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
          onLaneColor={onLaneColor}
        />
      )}

      {timeline?.length > 0 && (
        <TimelineOverlay
          vp={vp}
          size={size}
          timeline={timeline}
          onLabel={onColumnLabel}
          onAdd={onAddColumn}
          onAddLeft={onAddColumnStart}
          onRemove={onRemoveColumn}
        />
      )}

      <ConveyanceOverlay vp={vp} size={size} processes={processes} connectors={connectors} />

      <AbnormalityOverlay vp={vp} size={size} processes={processes} connectors={connectors} />

      {(notes?.length > 0 || onNoteText) && (
        <NotesOverlay vp={vp} size={size} notes={notes} onText={onNoteText} onMove={onNoteMove} onRemove={onNoteRemove} />
      )}

      {/* Bottom-left toolbar: opt-in lanes, notes, and group boxes. */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
        {onAddLane && lanes.length === 0 && (
          <button
            onClick={onAddLane}
            title="Add a swim lane"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={14} /> Swim lane
          </button>
        )}
        {onAddNote && (
          <button
            onClick={onAddNote}
            title="Add a note"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={14} /> Note
          </button>
        )}
        {onAddGroup && (
          <button
            onClick={onAddGroup}
            title="Add a group box"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={14} /> Group
          </button>
        )}
      </div>

      {processes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] text-slate-400">No processes in this view yet.</p>
        </div>
      )}
    </div>
  )
}
