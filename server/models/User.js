import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: String,
    email: String,
    provider: String, // 'sample' | 'entra'
  },
  { timestamps: true },
)

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema)
