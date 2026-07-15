import { makeSampleFlow, migrateFlowV1, normalizeFlow } from './flow'

// LocalStorage-backed persistence (the default, offline/demo backend). Functions
// are async to match the shared storage interface, but resolve synchronously.
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
  let map = readRaw(KEY)
  if (Object.keys(map).length === 0) map = migrateLegacy() // {} if nothing to migrate
  // Backfill newer fields (e.g. lanes) onto flows saved before they existed.
  for (const id of Object.keys(map)) map[id] = normalizeFlow(map[id])
  return map
}

export async function ensureSeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return
  const map = readAll()
  if (Object.keys(map).length === 0) {
    const demo = makeSampleFlow()
    map[demo.id] = demo
    writeAll(map)
  }
  localStorage.setItem(SEEDED_KEY, '1')
}

export async function listFlows() {
  return Object.values(readAll()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function getFlow(id) {
  return readAll()[id] || null
}

export async function saveFlow(flow) {
  const map = readAll()
  map[flow.id] = flow
  writeAll(map)
  return flow
}

export async function deleteFlow(id) {
  const map = readAll()
  delete map[id]
  writeAll(map)
}
