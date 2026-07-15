import { userRepository } from '../repositories/userRepository.js'

// Demo sign-in with no password — a placeholder until Entra is wired in. It
// ensures a single demo user exists and returns it. Swap AUTH_PROVIDER to
// `entra` (once configured) to replace this without touching the routes.
const DEMO_USER = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com', provider: 'sample' }

export const sampleProvider = {
  id: 'sample',
  kind: 'direct',
  async login() {
    await userRepository.upsert(DEMO_USER)
    return DEMO_USER
  },
}
