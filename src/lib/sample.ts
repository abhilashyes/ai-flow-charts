import { nanoid } from 'nanoid'
import type { VsmStateMap, VsmProject } from '../types'
import { toSeconds } from './units'

// A compact but realistic demo value stream: Supplier → Inventory → Stamping →
// Inventory → Assembly → Inventory → Shipping → Customer, with information flow
// from Production Control.
export function buildSampleCurrentState(): VsmStateMap {
  const supplier = mk('supplier', 40, 40, { label: 'Steel Supplier' })
  const control = mk('productionControl', 430, 20, { label: 'Production Control' })
  const customer = mk('customer', 860, 40, { label: 'Customer' })

  const i1 = mk('inventory', 220, 250, { label: 'Coils', quantity: 5, waitTime: toSeconds(5, 'days') })
  const p1 = mk('process', 320, 230, {
    label: 'Stamping',
    cycleTime: toSeconds(45, 'seconds'),
    changeover: toSeconds(60, 'minutes'),
    uptime: 85,
    operators: 1,
    batchSize: 200,
    shifts: 2,
  })
  const i2 = mk('inventory', 470, 250, { label: 'WIP', quantity: 3, waitTime: toSeconds(3, 'days') })
  const p2 = mk('process', 560, 230, {
    label: 'Assembly',
    cycleTime: toSeconds(62, 'seconds'),
    changeover: toSeconds(10, 'minutes'),
    uptime: 100,
    operators: 2,
    batchSize: 1,
    shifts: 2,
  })
  const i3 = mk('inventory', 700, 250, { label: 'Finished', quantity: 4, waitTime: toSeconds(4, 'days') })
  const p3 = mk('process', 780, 230, {
    label: 'Shipping',
    cycleTime: toSeconds(40, 'seconds'),
    changeover: 0,
    uptime: 100,
    operators: 1,
    batchSize: 1,
    shifts: 2,
  })

  const nodes = [supplier, control, customer, i1, p1, i2, p2, i3, p3]

  const edges = [
    pushEdge(supplier.id, i1.id),
    pushEdge(i1.id, p1.id),
    pushEdge(p1.id, i2.id),
    pushEdge(i2.id, p2.id),
    pushEdge(p2.id, i3.id),
    pushEdge(i3.id, p3.id),
    elecEdge(control.id, p1.id),
    elecEdge(control.id, p2.id),
    manualEdge(customer.id, control.id),
  ]

  return { id: nanoid(8), name: 'Current State', nodes, edges }
}

function mk(type: string, x: number, y: number, data: Record<string, unknown>) {
  return { id: nanoid(8), type: type as VsmStateMap['nodes'][number]['type'], position: { x, y }, data }
}

function pushEdge(source: string, target: string) {
  return { id: nanoid(8), source, target, type: 'push' }
}
function elecEdge(source: string, target: string) {
  return { id: nanoid(8), source, target, type: 'electronicInfo' }
}
function manualEdge(source: string, target: string) {
  return { id: nanoid(8), source, target, type: 'manualInfo' }
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
