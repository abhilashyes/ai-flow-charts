import { initialProcesses, initialConnectors } from './sampleData'
import { renumber } from './refnum'
import { DEFAULT_TIME_UNIT, COLUMN_W, DEFAULT_LANE_H, LANE_COLORS } from './constants'

const ROW_Y = 220 // default y for a row-laid-out shape
const LEGACY_ROW_H = 132 // old per-shape lane row height, for rows→height migration

// Assign a left-to-right position (aligned to timeline columns) to any process
// that has no saved position yet. Positions are persisted per shape thereafter.
export function layoutRow(processes) {
  return processes.map((p, i) =>
    p.x == null || p.y == null ? { ...p, x: (i + 0.5) * COLUMN_W, y: ROW_Y } : p,
  )
}

// Default timeline columns shown across the top of a diagram version.
function defaultTimeline() {
  return [
    { id: crypto.randomUUID(), label: 'Day 1' },
    { id: crypto.randomUUID(), label: 'Day 2' },
    { id: crypto.randomUUID(), label: 'Day 3' },
    { id: crypto.randomUUID(), label: 'Day 4' },
  ]
}

// An empty diagram for a single version. Swim lanes are opt-in (start with none;
// the user adds them if needed). `rows` on a lane is its height in shape-slots.
export function makeVersionChain() {
  return { processes: [], connectors: [], timeline: defaultTimeline(), lanes: [] }
}

const now = () => new Date().toISOString()

// A brand-new flow: all three versions start empty (each with default lanes).
export function makeBlankFlow(name = 'Untitled Value Chain') {
  const ts = now()
  return {
    id: crypto.randomUUID(),
    name,
    owner: 'local',
    versions: {
      current: makeVersionChain(),
      target: makeVersionChain(),
      ideal: makeVersionChain(),
    },
    createdAt: ts,
    updatedAt: ts,
  }
}

// A flow whose Current version is pre-populated with the demo diagram; Target
// and Ideal start empty. Sample processes are spread across the two lanes.
export function makeSampleFlow(name = 'Sample Value Chain') {
  const flow = makeBlankFlow(name)
  flow.versions.current = {
    processes: structuredClone(initialProcesses),
    connectors: structuredClone(initialConnectors),
    timeline: defaultTimeline(),
    lanes: [],
  }
  return flow
}

// Deep copy of a whole flow (all three versions) under a fresh id/name.
export function cloneFlow(flow, name) {
  const ts = now()
  return {
    ...structuredClone(flow),
    id: crypto.randomUUID(),
    name: name ?? `${flow.name} (copy)`,
    owner: 'local',
    createdAt: ts,
    updatedAt: ts,
  }
}

// Backfill the typed abnormality from the legacy boolean and keep both in sync
// (legacy `abnormal:true` with no type → 'excess'; falsy → 'none').
function withAbnormality(el) {
  const type = el.abnormalityType ?? (el.abnormal ? 'excess' : 'none')
  return { ...el, abnormalityType: type, abnormal: type !== 'none' }
}

// Strip the legacy `mode` tag and backfill time units + laneId on an element.
function normalizeElement(el) {
  const { mode, ...rest } = el
  return withAbnormality({
    ...rest,
    stdTimeUnit: rest.stdTimeUnit ?? DEFAULT_TIME_UNIT,
    idealTimeUnit: rest.idealTimeUnit ?? DEFAULT_TIME_UNIT,
    laneId: rest.laneId ?? null,
  })
}

// Convert a legacy v1 chain (flat processes/connectors with per-element `mode`)
// into a v2 flow: standard elements -> Current, ideal elements -> Ideal,
// Target empty. Ref numbers are renumbered contiguously within each version.
export function migrateFlowV1(oldChain) {
  const pick = (arr, mode) => arr.filter((x) => (x.mode ?? 'standard') === mode).map(normalizeElement)
  const version = (mode) => ({
    processes: renumber(pick(oldChain.processes ?? [], mode), 'P'),
    connectors: renumber(pick(oldChain.connectors ?? [], mode), 'C'),
    timeline: oldChain.timeline ? structuredClone(oldChain.timeline) : defaultTimeline(),
    lanes: [],
  })
  return {
    id: oldChain.id ?? crypto.randomUUID(),
    name: oldChain.name ?? 'Untitled Value Chain',
    owner: 'local',
    versions: { current: version('standard'), target: makeVersionChain(), ideal: version('ideal') },
    createdAt: oldChain.createdAt ?? now(),
    updatedAt: oldChain.updatedAt ?? now(),
  }
}

// Ensure a loaded flow has the current shape: lanes carry a pixel `height`,
// processes carry `laneId` + a saved position. Migrates legacy `rows`/`laneRow`.
export function normalizeFlow(flow) {
  if (!flow?.versions) return flow
  for (const key of Object.keys(flow.versions)) {
    const v = flow.versions[key]
    if (!v) continue
    v.lanes = Array.isArray(v.lanes)
      ? v.lanes.map(({ rows, ...l }, i) => ({
          ...l,
          height: l.height ?? (rows ? rows * LEGACY_ROW_H : DEFAULT_LANE_H),
          color: l.color ?? LANE_COLORS[i % LANE_COLORS.length],
        }))
      : []
    v.processes = layoutRow(
      (v.processes ?? []).map(({ laneRow, ...p }) => withAbnormality({ ...p, laneId: p.laneId ?? null })),
    )
    v.connectors = (v.connectors ?? []).map((c) => withAbnormality(c))
  }
  return flow
}
