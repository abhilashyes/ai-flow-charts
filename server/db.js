import mongoose from 'mongoose'
import { config } from './config.js'

// Connect to MongoDB. Only called when MONGODB_URI is set.
export async function connectDb() {
  mongoose.set('strictQuery', true)
  await mongoose.connect(config.mongoUri)
  console.log('[db] connected to MongoDB')
  return mongoose.connection
}
