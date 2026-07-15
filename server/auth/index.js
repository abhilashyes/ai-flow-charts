import { config } from '../config.js'
import { sampleProvider } from './sampleProvider.js'
import { entraProvider } from './entraProvider.js'

const providers = {
  sample: sampleProvider,
  entra: entraProvider,
}

export const authProvider = providers[config.authProvider] || sampleProvider
