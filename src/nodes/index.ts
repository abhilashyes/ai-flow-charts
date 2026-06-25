import type { NodeTypes } from '@xyflow/react'
import ProcessNode from './ProcessNode'
import InventoryNode from './InventoryNode'
import { SupermarketNode, FifoNode, SafetyStockNode } from './MaterialNodes'
import {
  CustomerNode,
  SupplierNode,
  ProductionControlNode,
  TruckNode,
} from './EntityNodes'
import { KaizenNode, AnnotationNode } from './ImprovementNodes'

export const nodeTypes: NodeTypes = {
  process: ProcessNode,
  inventory: InventoryNode,
  supermarket: SupermarketNode,
  fifo: FifoNode,
  safetyStock: SafetyStockNode,
  customer: CustomerNode,
  supplier: SupplierNode,
  productionControl: ProductionControlNode,
  truck: TruckNode,
  kaizen: KaizenNode,
  annotation: AnnotationNode,
}
