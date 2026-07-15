import { useMongo } from '../config.js'
import { UserModel } from '../models/User.js'

/**
 * UserRepository interface:
 *   getById(id)  -> Promise<user|null>
 *   upsert(user) -> Promise<user>
 */

class MemoryUserRepository {
  constructor() {
    this.map = new Map()
  }
  async getById(id) {
    return this.map.get(id) ?? null
  }
  async upsert(user) {
    this.map.set(user.id, user)
    return user
  }
}

class MongoUserRepository {
  async getById(id) {
    return await UserModel.findOne({ id }).lean()
  }
  async upsert(user) {
    await UserModel.updateOne({ id: user.id }, { $set: user }, { upsert: true })
    return user
  }
}

export const userRepository = useMongo ? new MongoUserRepository() : new MemoryUserRepository()
