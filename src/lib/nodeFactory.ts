import { nanoid } from 'nanoid'
import type { VsmNode, VsmNodeType } from '../types'

export interface StencilDef {
  type: VsmNodeType
  label: string
  category: 'material' | 'entity' | 'info' | 'improvement'
  tooltip: string
}

// Palette catalog. Order matters for display grouping.
export const STENCILS: StencilDef[] = [
  {
    type: 'process',
    label: 'Process Box',
    category: 'material',
    tooltip:
      'A process step. Holds a Data Box with Cycle Time (C/T), Changeover (C/O), Uptime %, Operators, Batch Size and Shifts. Cycle time feeds the Value-Added portion of the lead-time ladder.',
  },
  {
    type: 'inventory',
    label: 'Inventory (I)',
    category: 'material',
    tooltip:
      'Inventory / WIP triangle — the primary stagnation indicator. Quantity + wait time. Wait time feeds the Non-Value-Added portion of the lead-time ladder.',
  },
  {
    type: 'supermarket',
    label: 'Supermarket',
    category: 'material',
    tooltip: 'A controlled store of inventory used to schedule upstream production via pull.',
  },
  {
    type: 'fifo',
    label: 'FIFO Lane',
    category: 'material',
    tooltip: 'First-In-First-Out lane that limits inventory and enforces sequence between processes.',
  },
  {
    type: 'safetyStock',
    label: 'Safety / Buffer Stock',
    category: 'material',
    tooltip: 'Buffer or safety stock held to absorb demand or supply variability.',
  },
  {
    type: 'customer',
    label: 'Customer',
    category: 'entity',
    tooltip: 'External customer entity — the demand end of the value stream.',
  },
  {
    type: 'supplier',
    label: 'Supplier',
    category: 'entity',
    tooltip: 'External supplier entity — the source end of the value stream.',
  },
  {
    type: 'productionControl',
    label: 'Production Control',
    category: 'entity',
    tooltip: 'Central production control / scheduling function that sends information to processes.',
  },
  {
    type: 'truck',
    label: 'Shipment',
    category: 'entity',
    tooltip: 'Truck / shipment moving material between facilities.',
  },
  {
    type: 'kaizen',
    label: 'Kaizen Burst',
    category: 'improvement',
    tooltip: 'Kaizen burst — marks a targeted improvement, used mainly on future-state maps.',
  },
  {
    type: 'annotation',
    label: 'Note',
    category: 'improvement',
    tooltip: 'Free-text sticky note for annotations such as "bottleneck" or "stagnation".',
  },
]

const DEFAULT_DATA: Record<VsmNodeType, Record<string, unknown>> = {
  process: {
    label: 'Process',
    cycleTime: 0,
    changeover: 0,
    uptime: 100,
    operators: 1,
    batchSize: 1,
    shifts: 1,
  },
  inventory: { label: 'Inventory', quantity: 0, waitTime: 0 },
  supermarket: { label: 'Supermarket', quantity: 0 },
  fifo: { label: 'FIFO', quantity: 0 },
  safetyStock: { label: 'Safety Stock', quantity: 0 },
  customer: { label: 'Customer' },
  supplier: { label: 'Supplier' },
  productionControl: { label: 'Production Control' },
  truck: { label: 'Shipment' },
  kaizen: { label: 'Improvement' },
  annotation: { label: 'Note', text: 'Add a note…' },
}

export function defaultDataFor(type: VsmNodeType): Record<string, unknown> {
  return { ...DEFAULT_DATA[type] }
}

export function createNode(type: VsmNodeType, position: { x: number; y: number }): VsmNode {
  return {
    id: nanoid(8),
    type,
    position,
    data: defaultDataFor(type),
  }
}
