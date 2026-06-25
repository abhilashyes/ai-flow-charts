import { nanoid } from 'nanoid'
import type { VsmStateMap, VsmProject } from '../types'
import { toSeconds } from './units'

// A compact but realistic demo value stream using the Genba legend vocabulary:
// Supplier → A Type Store → Stamping → Conveyance → B Type Store → Assembly →
// Quality Check → Fix Area → Customer, with information flow from Production
// Control. Stores/areas carry wait time and so drive the Non-Value-Added total.
export function buildSampleCurrentState(): VsmStateMap {
  const supplier = mk('supplier', 40, 40, { label: 'Steel Supplier' })
  const control = mk('productionControl', 450, 20, { label: 'Production Control' })
  const customer = mk('customer', 950, 40, { label: 'Customer' })

  const coils = mk('aTypeStore', 40, 250, {
    label: 'Coils',
    quantity: 5,
    waitTime: toSeconds(5, 'days'),
  })
  const stamping = mk('process', 210, 235, {
    label: 'Stamping',
    cycleTime: toSeconds(45, 'seconds'),
    changeover: toSeconds(60, 'minutes'),
    uptime: 85,
    operators: 1,
    batchSize: 200,
    shifts: 2,
  })
  const conveyance = mk('conveyance', 380, 250, { label: 'Forklift' })
  const wip = mk('bTypeStore', 500, 250, {
    label: 'WIP',
    quantity: 3,
    waitTime: toSeconds(3, 'days'),
  })
  const assembly = mk('process', 650, 235, {
    label: 'Assembly',
    cycleTime: toSeconds(62, 'seconds'),
    changeover: toSeconds(10, 'minutes'),
    uptime: 100,
    operators: 2,
    batchSize: 1,
    shifts: 2,
  })
  const quality = mk('qualityCheck', 820, 240, { label: 'Final QC' })
  const finished = mk('fixArea', 950, 250, {
    label: 'Shipping Lane',
    quantity: 4,
    waitTime: toSeconds(4, 'days'),
  })

  const nodes = [supplier, control, customer, coils, stamping, conveyance, wip, assembly, quality, finished]

  const edges = [
    materialEdge(supplier.id, coils.id),
    materialEdge(coils.id, stamping.id),
    materialEdge(stamping.id, conveyance.id),
    materialEdge(conveyance.id, wip.id),
    materialEdge(wip.id, assembly.id),
    materialEdge(assembly.id, quality.id),
    materialEdge(quality.id, finished.id),
    materialEdge(finished.id, customer.id),
    infoEdge(control.id, stamping.id),
    infoEdge(control.id, assembly.id),
    infoEdge(customer.id, control.id),
  ]

  return { id: nanoid(8), name: 'Current State', nodes, edges }
}

function mk(type: string, x: number, y: number, data: Record<string, unknown>) {
  return { id: nanoid(8), type: type as VsmStateMap['nodes'][number]['type'], position: { x, y }, data }
}

function materialEdge(source: string, target: string) {
  return { id: nanoid(8), source, target, type: 'material' }
}
function infoEdge(source: string, target: string) {
  return { id: nanoid(8), source, target, type: 'information' }
}

export function buildSampleProject(): VsmProject {
  const current = buildSampleCurrentState()
  return {
    version: 1,
    timeUnit: 'days',
    states: [current],
    activeStateId: current.id,
  }
}
