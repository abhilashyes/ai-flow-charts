import mongoose from 'mongoose'

// A flow is stored as an opaque, owner-scoped document. The full client flow
// object lives under `data`; the server manages `owner` and mirrors `id`/
// `updatedAt` for querying/sorting. Domain normalization stays on the client.
const FlowSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    owner: { type: String, required: true, index: true },
    updatedAt: { type: String },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
)

FlowSchema.index({ owner: 1, id: 1 }, { unique: true })

export const FlowModel = mongoose.models.Flow || mongoose.model('Flow', FlowSchema)
