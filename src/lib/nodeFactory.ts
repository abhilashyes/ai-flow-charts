import { nanoid } from 'nanoid'
import type { VsmNode, VsmNodeType } from '../types'

export type StencilCategory = 'process' | 'stores' | 'abnormal' | 'info' | 'entity' | 'improvement'

export interface StencilDef {
  type: VsmNodeType
  label: string
  category: StencilCategory
  tooltip: string
}

// Palette catalog, mirroring the Genba VSM legend. Flow arrows (material /
// information) are not stencils — they are chosen in the top bar before
// connecting two nodes.
export const STENCILS: StencilDef[] = [
  // --- Flow & Process ---
  {
    type: 'process',
    label: 'Process / Line',
    category: 'process',
    tooltip:
      'A process / production line. Holds a Data Box (Cycle Time, Changeover, Uptime %, Operators, Batch, Shifts). Cycle time feeds the Value-Added portion of the lead-time ladder.',
  },
  {
    type: 'conveyance',
    label: 'Conveyance',
    category: 'process',
    tooltip: 'Movement of material by forklift, cart or truck between steps.',
  },
  {
    type: 'qualityCheck',
    label: 'Quality Check',
    category: 'process',
    tooltip: 'Quality check / investigation point (inspection).',
  },
  // --- Stores & Areas (count as inventory / NVA) ---
  {
    type: 'aTypeStore',
    label: 'A Type Store',
    category: 'stores',
    tooltip:
      'A Type Store — fixed area, fixed part no., several parts at a time with min/max and slot-to-Genba matching. Counts as inventory (wait time → NVA).',
  },
  {
    type: 'bTypeStore',
    label: 'B Type Store',
    category: 'stores',
    tooltip:
      'B Type Store — one part no. at a time, parts come in sequence, fixed area but not fixed part no. Counts as inventory (wait time → NVA).',
  },
  {
    type: 'aTypeStoreAbnormal',
    label: 'A Store (Abnormal)',
    category: 'stores',
    tooltip:
      'A Type Store with an abnormality present (over-max quantity or no part available). Counts as inventory (wait time → NVA).',
  },
  {
    type: 'fixArea',
    label: 'Fix Area',
    category: 'stores',
    tooltip:
      'A fixed area at Genba such as a collecting or shipping lane. Counts as inventory (wait time → NVA).',
  },
  {
    type: 'inventory',
    label: 'Inventory (I)',
    category: 'stores',
    tooltip:
      'Inventory / WIP triangle — the simplest stagnation indicator. Quantity + wait time; wait time feeds the Non-Value-Added portion of the lead-time ladder.',
  },
  // --- Abnormal ---
  {
    type: 'abnormalOverflow',
    label: 'Abnormal – Overflow',
    category: 'abnormal',
    tooltip: 'Abnormality flag — overflow (too much / over-max). Visual marker only.',
  },
  {
    type: 'abnormalShortage',
    label: 'Abnormal – Shortage',
    category: 'abnormal',
    tooltip: 'Abnormality flag — shortage (too little / starved). Visual marker only.',
  },
  // --- Information ---
  {
    type: 'paperInstruction',
    label: 'Paper Instruction',
    category: 'info',
    tooltip: 'Paper-based instruction (e.g. Tel mail). Visual marker — connect with an information arrow.',
  },
  {
    type: 'electronicInfo',
    label: 'Electronic Info',
    category: 'info',
    tooltip: 'Electronic information point. Visual marker — connect with an information arrow.',
  },
  // --- Entities ---
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
  // --- Improvement & Notes ---
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
    label: 'Process / Line',
    cycleTime: 0,
    changeover: 0,
    uptime: 100,
    operators: 1,
    batchSize: 1,
    shifts: 1,
  },
  inventory: { label: 'Inventory', quantity: 0, waitTime: 0 },
  // stores & areas
  aTypeStore: { label: 'A Type Store', quantity: 0, waitTime: 0 },
  bTypeStore: { label: 'B Type Store', quantity: 0, waitTime: 0 },
  aTypeStoreAbnormal: { label: 'A Store (Abnormal)', quantity: 0, waitTime: 0 },
  fixArea: { label: 'Fix Area', quantity: 0, waitTime: 0 },
  // abnormality markers
  abnormalOverflow: { label: 'Overflow', note: '' },
  abnormalShortage: { label: 'Shortage', note: '' },
  // process-adjacent symbols
  conveyance: { label: 'Conveyance' },
  qualityCheck: { label: 'Quality Check' },
  paperInstruction: { label: 'Paper Instruction' },
  electronicInfo: { label: 'Electronic Info' },
  // entities & improvement
  customer: { label: 'Customer' },
  supplier: { label: 'Supplier' },
  productionControl: { label: 'Production Control' },
  kaizen: { label: 'Improvement' },
  annotation: { label: 'Note', text: 'Add a note…' },
  // retained for back-compat with older saved maps
  supermarket: { label: 'Supermarket', quantity: 0 },
  fifo: { label: 'FIFO', quantity: 0 },
  safetyStock: { label: 'Safety Stock', quantity: 0 },
  truck: { label: 'Shipment' },
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
