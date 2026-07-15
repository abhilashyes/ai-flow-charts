// Storage selector. Two interchangeable async backends:
//  - storeApi   (REST API → MongoDB) when VITE_API_URL is set
//  - storeLocal (browser localStorage) otherwise — the default demo/offline mode
// Consumers import from here, so switching backends is purely a config change.
import * as local from './storeLocal'
import * as api from './storeApi'

export const API_MODE = Boolean(import.meta.env.VITE_API_URL)

const backend = API_MODE ? api : local

export const listFlows = backend.listFlows
export const getFlow = backend.getFlow
export const saveFlow = backend.saveFlow
export const deleteFlow = backend.deleteFlow
export const ensureSeeded = backend.ensureSeeded
