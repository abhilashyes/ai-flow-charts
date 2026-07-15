import { initialProcesses, initialConnectors } from './sampleData'
import { renumber } from './refnum'
import { DEFAULT_TIME_UNIT } from './constants'

// Default timeline columns shown across the top of a diagram version.
function defaultTimeline() {
  return [
    { id: crypto.randomUUID(), label: 'Day 1' },
    { id: crypto.randomUUID(), label: 'Day 2' },
    { id: crypto.randomUUID(), label: 'Day 3' },
    { id: crypto.randomUUID(), label: 'Day 4' },
  ]
}

// Default swim lanes (horizontal rows) for a diagram version.
export function defaultLanes() {
  return [
    { id: crypto.randomUUID(), label: 'Lane 1' },
    { id: crypto.randomUUID(), label: 'Lane 2' },
  ]
}

// An empty diagram for a single version.
export function makeVersionChain() {
  return { processes: [], connectors: [], timeline: defaultTimeline(), lanes: defaultLanes() }
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
  const lanes = defaultLanes()
  const processes = structuredClone(initialProcesses).map((p, i) => ({
    ...p,
    laneId: lanes[i % lanes.length].id,
  }))
  flow.versions.current = {
    processes,
    connectors: structuredClone(initialConnectors),
    timeline: defaultTimeline(),
    lanes,
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

// Strip the legacy `mode` tag and backfill time units + laneId on an element.
function normalizeElement(el) {
  const { mode, ...rest } = el
  return {
    ...rest,
    stdTimeUnit: rest.stdTimeUnit ?? DEFAULT_TIME_UNIT,
    idealTimeUnit: rest.idealTimeUnit ?? DEFAULT_TIME_UNIT,
    laneId: rest.laneId ?? null,
  }
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
    lanes: defaultLanes(),
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

// Ensure a loaded flow has the current shape: every version has a `lanes` array
// and every process has a `laneId` key. Backfills flows saved before lanes.
export function normalizeFlow(flow) {
  if (!flow?.versions) return flow
  for (const key of Object.keys(flow.versions)) {
    const v = flow.versions[key]
    if (!v) continue
    if (!Array.isArray(v.lanes)) v.lanes = defaultLanes()
    v.processes = (v.processes ?? []).map((p) => (p.laneId === undefined ? { ...p, laneId: null } : p))
  }
  return flow
}
