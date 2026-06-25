import type { VsmNode, VsmStateMap, VsmMetrics, LadderStep, ProcessData, InventoryData } from '../types'

// Node types that represent stagnation / WIP and therefore contribute their
// wait time to Non-Value-Added time: the Inventory triangle plus all stores
// and areas from the Genba legend. They all carry a `waitTime` field.
const INVENTORY_TYPES = new Set([
  'inventory',
  'aTypeStore',
  'bTypeStore',
  'aTypeStoreAbnormal',
  'fixArea',
])

function isInventory(n: VsmNode): boolean {
  return !!n.type && INVENTORY_TYPES.has(n.type)
}

/** Pull process + inventory/store nodes ordered left-to-right (flow direction). */
export function orderedFlowNodes(nodes: VsmNode[]): VsmNode[] {
  return nodes
    .filter((n) => n.type === 'process' || isInventory(n))
    .slice()
    .sort((a, b) => a.position.x - b.position.x)
}

/** Build the lead-time ladder from the flow nodes, ordered by horizontal position. */
export function buildLadder(state: VsmStateMap): LadderStep[] {
  return orderedFlowNodes(state.nodes).map((n) => {
    if (n.type === 'process') {
      const d = n.data as unknown as ProcessData
      return {
        id: n.id,
        kind: 'va' as const,
        label: d.label || 'Process',
        seconds: Number(d.cycleTime) || 0,
      }
    }
    const d = n.data as unknown as InventoryData
    return {
      id: n.id,
      kind: 'nva' as const,
      label: d.label || 'Inventory',
      seconds: Number(d.waitTime) || 0,
    }
  })
}

const cycleSeconds = (n: VsmNode) => Number((n.data as unknown as ProcessData).cycleTime) || 0
const waitSeconds = (n: VsmNode) => Number((n.data as unknown as InventoryData).waitTime) || 0

/** Compute the aggregate VSM metrics for a state map. */
export function computeMetrics(state: VsmStateMap): VsmMetrics {
  let va = 0
  let nva = 0
  let processCount = 0
  let inventoryCount = 0

  for (const n of state.nodes) {
    if (n.type === 'process') {
      processCount++
      va += cycleSeconds(n)
    } else if (isInventory(n)) {
      inventoryCount++
      nva += waitSeconds(n)
    }
  }

  const leadTime = va + nva
  const vaRatio = leadTime > 0 ? (va / leadTime) * 100 : 0

  return {
    leadTime,
    valueAddedTime: va,
    nonValueAddedTime: nva,
    vaRatio,
    processCount,
    inventoryCount,
  }
}

export interface MetricDelta {
  key: string
  label: string
  current: number
  future: number
  /** absolute difference future - current */
  delta: number
  /** percent change relative to current */
  percent: number
  /** true when a lower value is the improvement (lead time, NVA, counts) */
  lowerIsBetter: boolean
}

export function computeDeltas(current: VsmMetrics, future: VsmMetrics): MetricDelta[] {
  const mk = (
    key: string,
    label: string,
    c: number,
    f: number,
    lowerIsBetter: boolean,
  ): MetricDelta => ({
    key,
    label,
    current: c,
    future: f,
    delta: f - c,
    percent: c !== 0 ? ((f - c) / c) * 100 : 0,
    lowerIsBetter,
  })

  return [
    mk('leadTime', 'Total Lead Time', current.leadTime, future.leadTime, true),
    mk('va', 'Value-Added Time', current.valueAddedTime, future.valueAddedTime, false),
    mk('vaRatio', 'VA Ratio (PCE)', current.vaRatio, future.vaRatio, false),
    mk('steps', 'Process Steps', current.processCount, future.processCount, true),
    mk('inv', 'Inventory Points', current.inventoryCount, future.inventoryCount, true),
  ]
}
