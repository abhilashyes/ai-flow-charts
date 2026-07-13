// Display / editing modes for the value chain.
export const MODES = {
  STANDARD: 'standard',
  IDEAL: 'ideal',
  COMPARISON: 'comparison',
}

export const MODE_OPTIONS = [
  { value: MODES.STANDARD, label: 'Standard', help: 'Edit and view the as-is value chain.' },
  { value: MODES.IDEAL, label: 'Ideal', help: 'Edit and view the to-be / target value chain.' },
  { value: MODES.COMPARISON, label: 'Comparison', help: 'View Standard and Ideal side by side.' },
]

// Process node shapes.
export const PROCESS_TYPES = [
  { value: 'rectangle', label: 'Rectangle (task)' },
  { value: 'diamond', label: 'Diamond (decision)' },
]

// Connector kinds.
export const CONNECTOR_TYPES = [
  { value: 'process-flow', label: 'Process Flow' },
  { value: 'information-flow', label: 'Information Flow' },
]

// How material/information is conveyed between processes.
export const CONVEYANCE_MODES = [
  'Email',
  'API',
  'Manual Handoff',
  'Physical Transport',
  'Database Sync',
  'Meeting',
  'Conveyor',
  'Other',
]

export const TABS = {
  PROCESSES: 'processes',
  CONNECTORS: 'connectors',
  SETTINGS: 'settings',
}
