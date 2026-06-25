import type { NodeTypes } from '@xyflow/react'
import ProcessNode from './ProcessNode'
import InventoryNode from './InventoryNode'
import { SupermarketNode, FifoNode, SafetyStockNode } from './MaterialNodes'
import { CustomerNode, SupplierNode, ProductionControlNode, TruckNode } from './EntityNodes'
import { KaizenNode, AnnotationNode } from './ImprovementNodes'
import {
  ATypeStoreNode,
  BTypeStoreNode,
  ATypeStoreAbnormalNode,
  FixAreaNode,
} from './StoreNode'
import {
  AbnormalOverflowNode,
  AbnormalShortageNode,
  ConveyanceNode,
  QualityCheckNode,
  PaperInstructionNode,
  ElectronicInfoNode,
} from './GenbaNodes'

export const nodeTypes: NodeTypes = {
  process: ProcessNode,
  inventory: InventoryNode,
  // stores & areas
  aTypeStore: ATypeStoreNode,
  bTypeStore: BTypeStoreNode,
  aTypeStoreAbnormal: ATypeStoreAbnormalNode,
  fixArea: FixAreaNode,
  // abnormality markers
  abnormalOverflow: AbnormalOverflowNode,
  abnormalShortage: AbnormalShortageNode,
  // process-adjacent symbols
  conveyance: ConveyanceNode,
  qualityCheck: QualityCheckNode,
  paperInstruction: PaperInstructionNode,
  electronicInfo: ElectronicInfoNode,
  // entities & improvement
  customer: CustomerNode,
  supplier: SupplierNode,
  productionControl: ProductionControlNode,
  kaizen: KaizenNode,
  annotation: AnnotationNode,
  // retained for back-compat with older saved maps
  supermarket: SupermarketNode,
  fifo: FifoNode,
  safetyStock: SafetyStockNode,
  truck: TruckNode,
}
