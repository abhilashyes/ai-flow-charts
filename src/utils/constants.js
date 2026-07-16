// The three independently-editable versions every flow carries.
export const VERSIONS = [
  { value: 'current', label: 'Current', help: 'The as-is value chain.' },
  { value: 'target', label: 'Target', help: 'The near-term to-be value chain.' },
  { value: 'ideal', label: 'Ideal', help: 'The theoretical best-case value chain.' },
]

export const VERSION_LABEL = Object.fromEntries(VERSIONS.map((v) => [v.value, v.label]))

// Units a time value can be captured in. `toSeconds` normalizes for totals.
export const TIME_UNITS = [
  { value: 's', label: 'Seconds', short: 's', toSeconds: 1 },
  { value: 'min', label: 'Minutes', short: 'min', toSeconds: 60 },
  { value: 'hr', label: 'Hours', short: 'hr', toSeconds: 3600 },
  { value: 'day', label: 'Days', short: 'd', toSeconds: 86400 },
  { value: 'wk', label: 'Weeks', short: 'wk', toSeconds: 604800 },
  { value: 'mo', label: 'Months', short: 'mo', toSeconds: 2592000 },
]

export const DEFAULT_TIME_UNIT = 'min'

// Width of one timeline column in flow (model) coordinates. Shared so initial
// shape placement can align to columns. Shapes snap their X to a column centre.
export const COLUMN_W = 196
// Default swim-lane height in model coordinates (freely resizable).
export const DEFAULT_LANE_H = 160

// Subtle, light lane tints the user can pick from (kept pale so process shapes,
// which carry their own fills, stay readable on top). New lanes auto-cycle these.
export const LANE_COLORS = [
  '#f1f5f9', // slate
  '#eff6ff', // blue
  '#ecfdf5', // emerald
  '#fffbeb', // amber
  '#fef2f2', // red
  '#faf5ff', // purple
  '#f0fdfa', // teal
  '#fdf2f8', // pink
]
export const DEFAULT_LANE_COLOR = LANE_COLORS[0]

const UNIT_BY_VALUE = new Map(TIME_UNITS.map((u) => [u.value, u]))
export function timeUnit(value) {
  return UNIT_BY_VALUE.get(value) ?? UNIT_BY_VALUE.get(DEFAULT_TIME_UNIT)
}

// Process node shapes are defined in the shape registry (single source of
// truth). Re-exported here so existing importers keep their import path.
export { PROCESS_TYPES } from './shapes'

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
  JSON: 'json',
}
