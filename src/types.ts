import type { Node, Edge } from '@xyflow/react'

// ---------------------------------------------------------------------------
// Time units. All time values are stored canonically in SECONDS and converted
// for display based on the globally-selected unit.
// ---------------------------------------------------------------------------
export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months'

export const TIME_UNITS: { value: TimeUnit; label: string; short: string }[] = [
  { value: 'seconds', label: 'Seconds', short: 's' },
  { value: 'minutes', label: 'Minutes', short: 'min' },
  { value: 'hours', label: 'Hours', short: 'hr' },
  { value: 'days', label: 'Days', short: 'd' },
  { value: 'weeks', label: 'Weeks', short: 'wk' },
  { value: 'months', label: 'Months', short: 'mo' },
]

// ---------------------------------------------------------------------------
// Node kinds + their data shapes.
// ---------------------------------------------------------------------------
export type VsmNodeType =
  | 'process'
  | 'inventory'
  | 'supermarket'
  | 'fifo'
  | 'safetyStock'
  | 'customer'
  | 'supplier'
  | 'productionControl'
  | 'truck'
  | 'kaizen'
  | 'annotation'

export interface ProcessData {
  label: string
  cycleTime: number // seconds, VA time
  changeover: number // seconds
  uptime: number // percent
  operators: number
  batchSize: number
  shifts: number
}

export interface InventoryData {
  label: string
  quantity: number
  waitTime: number // seconds, NVA time
}

export interface SimpleLabelData {
  label: string
}

export interface SupermarketData {
  label: string
  quantity: number
}

export interface AnnotationData {
  label: string
  text: string
}

export type NodeData =
  | ProcessData
  | InventoryData
  | SimpleLabelData
  | SupermarketData
  | AnnotationData

export type VsmNode = Node
export type VsmEdge = Edge

export type VsmEdgeType = 'push' | 'pull' | 'manualInfo' | 'electronicInfo' | 'default'

// ---------------------------------------------------------------------------
// A single named "state" of the value stream (e.g. Current, Future).
// ---------------------------------------------------------------------------
export interface VsmStateMap {
  id: string
  name: string
  nodes: VsmNode[]
  edges: VsmEdge[]
}

export interface VsmProject {
  version: number
  timeUnit: TimeUnit
  states: VsmStateMap[]
  activeStateId: string
}

// ---------------------------------------------------------------------------
// Derived metrics for a single state map.
// ---------------------------------------------------------------------------
export interface VsmMetrics {
  leadTime: number // seconds
  valueAddedTime: number // seconds
  nonValueAddedTime: number // seconds
  vaRatio: number // percent (0-100)
  processCount: number
  inventoryCount: number
}

// A single rung on the lead-time ladder.
export interface LadderStep {
  id: string
  kind: 'va' | 'nva'
  label: string
  seconds: number
}
