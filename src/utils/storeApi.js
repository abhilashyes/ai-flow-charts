import { makeSampleFlow, normalizeFlow } from './flow'

// REST-API backend (used when VITE_API_URL is set). Talks to the Express/Mongo
// server; the session cookie is sent with `credentials: 'include'`. Domain
// normalization stays here (shared with the local backend) so the server can be
// a thin owner-scoped document store.
const BASE = `${import.meta.env.VITE_API_URL}/api/flows`

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

export async function listFlows() {
  const flows = await req('')
  return flows.map(normalizeFlow).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function getFlow(id) {
  try {
    return normalizeFlow(await req(`/${id}`))
  } catch {
    return null
  }
}

export async function saveFlow(flow) {
  return req(`/${flow.id}`, { method: 'PUT', body: JSON.stringify(flow) })
}

export async function deleteFlow(id) {
  await req(`/${id}`, { method: 'DELETE' })
}

// Seed a demo flow the first time an account has none, mirroring the local mode.
export async function ensureSeeded() {
  const flows = await req('')
  if (flows.length === 0) {
    await req('', { method: 'POST', body: JSON.stringify(makeSampleFlow()) })
  }
}
