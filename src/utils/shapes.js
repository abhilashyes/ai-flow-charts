// Single source of truth for process node shapes.
//
// Each shape — standard or custom — is ONE entry here. The dropdown labels, the
// Cytoscape node styling, the connector-routing bounding box, and the list-tile
// icon are all derived from this array, so adding a shape means adding one entry
// (and renaming one only touches its `label`).
//
// IMPORTANT: `value` is a STABLE data key persisted on every process
// (`process.type`) and part of the integration contract (docs/INTEGRATIONS.md).
// Never rename or repurpose an existing `value`; only labels are display text.
import { Square, Diamond, UserRound, Triangle, Sparkles, Database, Truck, User, Store } from 'lucide-react'

// Encode an inline SVG as a data URI usable as a Cytoscape `background-image`.
// Same self-contained pattern the app already uses for embedded imagery, so it
// satisfies the CSP (no external refs).
export function svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// --- Custom VSM glyphs (rendered as image shapes) --------------------------
// Small, crisp, palette-matched SVGs. The node label renders BELOW the glyph.
const INVENTORY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 84">
  <polygon points="48,78 6,10 90,10" fill="#fef9c3" stroke="#ca8a04" stroke-width="4" stroke-linejoin="round"/>
  <text x="48" y="42" font-family="sans-serif" font-size="26" font-weight="700" fill="#a16207" text-anchor="middle">I</text>
</svg>`

const KAIZEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,4 59,30 82,18 71,42 96,50 71,58 82,82 59,70 50,96 41,70 18,82 29,58 4,50 29,42 18,18 41,30" fill="#fee2e2" stroke="#dc2626" stroke-width="3" stroke-linejoin="round"/>
</svg>`

const DATA_BOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70">
  <rect x="4" y="4" width="112" height="62" rx="4" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"/>
  <line x1="4" y1="26" x2="116" y2="26" stroke="#7c3aed" stroke-width="2"/>
  <line x1="4" y1="46" x2="116" y2="46" stroke="#7c3aed" stroke-width="2"/>
  <line x1="60" y1="26" x2="60" y2="66" stroke="#7c3aed" stroke-width="2"/>
</svg>`

const SHIPMENT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 76">
  <rect x="4" y="20" width="72" height="36" rx="3" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
  <path d="M76 30 h26 l16 16 v10 h-42 z" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="30" cy="60" r="9" fill="#1e293b" stroke="#1d4ed8" stroke-width="3"/>
  <circle cx="98" cy="60" r="9" fill="#1e293b" stroke="#1d4ed8" stroke-width="3"/>
</svg>`

const OPERATOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 84">
  <circle cx="45" cy="22" r="16" fill="#dcfce7" stroke="#15803d" stroke-width="3"/>
  <path d="M9 80 a36 36 0 0 1 72 0 z" fill="#dcfce7" stroke="#15803d" stroke-width="3" stroke-linejoin="round"/>
</svg>`

const SUPERMARKET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 76">
  <path d="M12 6 H114 V70 H12" fill="#fff7ed" stroke="#ea580c" stroke-width="3" stroke-linejoin="round"/>
  <line x1="12" y1="28" x2="114" y2="28" stroke="#ea580c" stroke-width="2"/>
  <line x1="12" y1="48" x2="114" y2="48" stroke="#ea580c" stroke-width="2"/>
</svg>`

// --- The registry ----------------------------------------------------------
// Order here is the order shown in the Type dropdown.
export const SHAPES = [
  // Standard vector shapes (values unchanged; labels renamed).
  {
    value: 'rectangle',
    label: 'Process (Rectangle)',
    render: 'vector',
    cyShape: 'round-rectangle',
    bg: '#dbeafe',
    border: '#3b82f6',
    width: 136,
    height: 68,
    textMaxWidth: '120px',
    Icon: Square,
    iconColor: 'text-blue-500',
  },
  {
    value: 'diamond',
    label: 'Decision (Diamond)',
    render: 'vector',
    cyShape: 'diamond',
    bg: '#ffedd5',
    border: '#f97316',
    width: 108,
    height: 108,
    textMaxWidth: '66px',
    Icon: Diamond,
    iconColor: 'text-orange-500',
  },
  {
    value: 'customer',
    label: 'Customer (Rectangle)',
    render: 'vector',
    cyShape: 'round-rectangle',
    bg: '#dcfce7',
    border: '#16a34a',
    width: 136,
    height: 68,
    textMaxWidth: '120px',
    Icon: UserRound,
    iconColor: 'text-emerald-600',
  },
  // Custom VSM image shapes. The glyph is an SVG; the label sits below it.
  {
    value: 'inventory',
    label: 'Inventory (Triangle)',
    render: 'image',
    svg: INVENTORY_SVG,
    width: 96,
    height: 84,
    textMaxWidth: '130px',
    Icon: Triangle,
    iconColor: 'text-amber-600',
  },
  {
    value: 'kaizen',
    label: 'Kaizen Burst',
    render: 'image',
    svg: KAIZEN_SVG,
    width: 100,
    height: 100,
    textMaxWidth: '130px',
    Icon: Sparkles,
    iconColor: 'text-red-500',
  },
  {
    value: 'data-box',
    label: 'Data Box',
    render: 'image',
    svg: DATA_BOX_SVG,
    width: 128,
    height: 74,
    textMaxWidth: '130px',
    Icon: Database,
    iconColor: 'text-violet-600',
  },
  {
    value: 'shipment',
    label: 'Shipment (Truck)',
    render: 'image',
    svg: SHIPMENT_SVG,
    width: 132,
    height: 76,
    textMaxWidth: '130px',
    Icon: Truck,
    iconColor: 'text-blue-600',
  },
  {
    value: 'operator',
    label: 'Operator',
    render: 'image',
    svg: OPERATOR_SVG,
    width: 96,
    height: 90,
    textMaxWidth: '130px',
    Icon: User,
    iconColor: 'text-green-600',
  },
  {
    value: 'supermarket',
    label: 'Supermarket',
    render: 'image',
    svg: SUPERMARKET_SVG,
    width: 128,
    height: 80,
    textMaxWidth: '130px',
    Icon: Store,
    iconColor: 'text-orange-600',
  },
]

// Dropdown source (value + label only). Existing importers keep working.
export const PROCESS_TYPES = SHAPES.map(({ value, label }) => ({ value, label }))

// O(1) lookup by stable value. Fall back to 'rectangle' for unknown/legacy data.
export const shapeByValue = new Map(SHAPES.map((s) => [s.value, s]))
export const DEFAULT_SHAPE = shapeByValue.get('rectangle')

export function shapeOf(value) {
  return shapeByValue.get(value) ?? DEFAULT_SHAPE
}

// Generate the per-shape Cytoscape style blocks from the registry. Spread these
// after the base `node` block so image shapes' overrides win.
export function cyShapeStyles() {
  return SHAPES.map((s) => {
    const style =
      s.render === 'image'
        ? {
            shape: 'round-rectangle',
            'background-image': svgDataUri(s.svg),
            'background-fit': 'contain',
            'background-opacity': 0, // transparent node; only the glyph shows
            'border-width': 0,
            width: s.width,
            height: s.height,
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'text-max-width': s.textMaxWidth,
          }
        : {
            shape: s.cyShape,
            'background-color': s.bg,
            'border-color': s.border,
            width: s.width,
            height: s.height,
            'text-max-width': s.textMaxWidth,
          }
    return { selector: `node[shape = "${s.value}"]`, style }
  })
}
