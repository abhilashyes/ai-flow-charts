import { useMongo } from '../config.js'
import { FlowModel } from '../models/Flow.js'

/**
 * FlowRepository interface (the storage seam). Flows are opaque owner-scoped
 * documents; every method is scoped to an `owner` (the authenticated user id).
 *
 *   list(owner)          -> Promise<flow[]>   (most-recently-updated first)
 *   get(owner, id)       -> Promise<flow|null>
 *   upsert(owner, flow)  -> Promise<flow>     (creates or replaces by id)
 *   remove(owner, id)    -> Promise<void>
 *
 * Two interchangeable implementations are provided; a different datastore can
 * implement the same four methods.
 */

const byUpdatedDesc = (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)

// In-memory (default when no MONGODB_URI): data lives for the process lifetime.
class MemoryFlowRepository {
  constructor() {
    this.map = new Map() // `${owner}::${id}` -> flow
  }
  key(owner, id) {
    return `${owner}::${id}`
  }
  async list(owner) {
    return [...this.map.values()].filter((f) => f.owner === owner).sort(byUpdatedDesc)
  }
  async get(owner, id) {
    return this.map.get(this.key(owner, id)) ?? null
  }
  async upsert(owner, flow) {
    const data = { ...flow, owner }
    this.map.set(this.key(owner, data.id), data)
    return data
  }
  async remove(owner, id) {
    this.map.delete(this.key(owner, id))
  }
}

// MongoDB-backed implementation (used when MONGODB_URI is set).
class MongoFlowRepository {
  async list(owner) {
    const docs = await FlowModel.find({ owner }).lean()
    return docs.map((d) => d.data).sort(byUpdatedDesc)
  }
  async get(owner, id) {
    const doc = await FlowModel.findOne({ owner, id }).lean()
    return doc ? doc.data : null
  }
  async upsert(owner, flow) {
    const data = { ...flow, owner }
    await FlowModel.updateOne(
      { owner, id: data.id },
      { $set: { owner, id: data.id, updatedAt: data.updatedAt, data } },
      { upsert: true },
    )
    return data
  }
  async remove(owner, id) {
    await FlowModel.deleteOne({ owner, id })
  }
}

export const flowRepository = useMongo ? new MongoFlowRepository() : new MemoryFlowRepository()
