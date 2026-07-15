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

// An empty diagram for a single version.
export function makeVersionChain() {
  return { processes: [], connectors: [], timeline: defaultTimeline() }
}

const now = () => new Date().toISOString()

// A brand-new flow: all three versions start empty.
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
// and Ideal start empty.
export function makeSampleFlow(name = 'Sample Value Chain') {
  const flow = makeBlankFlow(name)
  flow.versions.current = {
    processes: structuredClone(initialProcesses),
    connectors: structuredClone(initialConnectors),
    timeline: defaultTimeline(),
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

// Strip the legacy `mode` tag and backfill time units on a migrated element.
function normalizeElement(el) {
  const { mode, ...rest } = el
  return {
    ...rest,
    stdTimeUnit: rest.stdTimeUnit ?? DEFAULT_TIME_UNIT,
    idealTimeUnit: rest.idealTimeUnit ?? DEFAULT_TIME_UNIT,
  }
}

// Convert a legacy v1 chain (flat processes/connectors with per-element `mode`)
// into a v2 flow: standard elements -> Current, ideal elements -> Ideal,
// Target empty. Ref numbers are renumbered contiguously within each version.
export function migrateFlowV1(oldChain) {
  const pick = (arr, mode) => arr.filter((x) => (x.mode ?? 'standard') === mode).map(normalizeElement)
  const current = {
    processes: renumber(pick(oldChain.processes ?? [], 'standard'), 'P'),
    connectors: renumber(pick(oldChain.connectors ?? [], 'standard'), 'C'),
    timeline: oldChain.timeline ? structuredClone(oldChain.timeline) : defaultTimeline(),
  }
  const ideal = {
    processes: renumber(pick(oldChain.processes ?? [], 'ideal'), 'P'),
    connectors: renumber(pick(oldChain.connectors ?? [], 'ideal'), 'C'),
    timeline: oldChain.timeline ? structuredClone(oldChain.timeline) : defaultTimeline(),
  }
  return {
    id: oldChain.id ?? crypto.randomUUID(),
    name: oldChain.name ?? 'Untitled Value Chain',
    owner: 'local',
    versions: { current, target: makeVersionChain(), ideal },
    createdAt: oldChain.createdAt ?? now(),
    updatedAt: oldChain.updatedAt ?? now(),
  }
}
