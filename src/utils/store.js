import { makeSampleChain } from './flow'

// LocalStorage-backed persistence for many flows, keyed by flow id. Each stored
// value is a full chain object (see utils/flow.js). This is the client-side
// stand-in until a backend is added.
const KEY = 'vcm.flows.v1'
const SEEDED_KEY = 'vcm.seeded.v1'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  localStorage.setItem(KEY, JSON.stringify(map))
}

// Seed a single demo flow the very first time the app is opened, so the Home
// screen isn't empty. Runs once (guarded by a flag) even if the user later
// deletes every flow.
export function ensureSeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return
  const map = readAll()
  if (Object.keys(map).length === 0) {
    const demo = makeSampleChain()
    map[demo.id] = demo
    writeAll(map)
  }
  localStorage.setItem(SEEDED_KEY, '1')
}

// All flows, most-recently-updated first.
export function listFlows() {
  return Object.values(readAll()).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )
}

export function getFlow(id) {
  return readAll()[id] || null
}

// Upsert a flow by its id.
export function saveFlow(chain) {
  const map = readAll()
  map[chain.id] = chain
  writeAll(map)
}

export function deleteFlow(id) {
  const map = readAll()
  delete map[id]
  writeAll(map)
}
