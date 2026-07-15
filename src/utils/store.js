import { makeSampleFlow, migrateFlowV1 } from './flow'

// LocalStorage-backed persistence for many flows, keyed by flow id. Each stored
// value is a full flow object (see utils/flow.js) with three versions. This is
// the client-side stand-in until a backend is added.
const KEY = 'vcm.flows.v2'
const LEGACY_KEY = 'vcm.flows.v1' // pre-versions flat chains
const SEEDED_KEY = 'vcm.seeded.v1'

function readRaw(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  localStorage.setItem(KEY, JSON.stringify(map))
}

// One-time migration of legacy v1 chains (flat, per-element `mode`) into v2
// flows (three versions). Runs when v2 is empty but v1 has data.
function migrateLegacy() {
  const legacy = readRaw(LEGACY_KEY)
  const ids = Object.keys(legacy)
  if (ids.length === 0) return {}
  const migrated = {}
  ids.forEach((id) => {
    const flow = migrateFlowV1(legacy[id])
    migrated[flow.id] = flow
  })
  writeAll(migrated)
  return migrated
}

function readAll() {
  const map = readRaw(KEY)
  if (Object.keys(map).length > 0) return map
  return migrateLegacy() // {} if there was nothing to migrate
}

// Seed a single demo flow the very first time the app is opened, so the Home
// screen isn't empty. Runs once (guarded by a flag) even if the user later
// deletes every flow.
export function ensureSeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return
  const map = readAll()
  if (Object.keys(map).length === 0) {
    const demo = makeSampleFlow()
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
export function saveFlow(flow) {
  const map = readAll()
  map[flow.id] = flow
  writeAll(map)
}

export function deleteFlow(id) {
  const map = readAll()
  delete map[id]
  writeAll(map)
}
