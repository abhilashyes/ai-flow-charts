import { initialProcesses, initialConnectors } from './sampleData'

// Default timeline columns shown across the top of a new diagram.
function defaultTimeline() {
  return [
    { id: crypto.randomUUID(), label: 'Day 1' },
    { id: crypto.randomUUID(), label: 'Day 2' },
    { id: crypto.randomUUID(), label: 'Day 3' },
    { id: crypto.randomUUID(), label: 'Day 4' },
  ]
}

// A brand-new, empty flow.
export function makeBlankChain(name = 'Untitled Value Chain') {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    processes: [],
    connectors: [],
    timeline: defaultTimeline(),
    createdAt: now,
    updatedAt: now,
  }
}

// A flow pre-populated with the demo processes/connectors.
export function makeSampleChain(name = 'Sample Value Chain') {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    processes: initialProcesses,
    connectors: initialConnectors,
    timeline: defaultTimeline(),
    createdAt: now,
    updatedAt: now,
  }
}

// A deep copy of a flow under a fresh id/name (for "Duplicate").
export function cloneChain(chain, name) {
  const now = new Date().toISOString()
  return {
    ...structuredClone(chain),
    id: crypto.randomUUID(),
    name: name ?? `${chain.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  }
}
