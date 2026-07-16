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
import {
  Square, Diamond, UserRound, Triangle, Sparkles, Database, Truck, User, Store,
  Factory, PersonStanding, Monitor, Server, Printer,
} from 'lucide-react'

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

const FACTORY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 84">
  <rect x="12" y="12" width="12" height="22" fill="#cbd5e1" stroke="#475569" stroke-width="3"/>
  <path d="M12 78 V46 L12 30 L40 46 L40 30 L68 46 L68 30 L96 46 L96 30 L120 46 V78 Z" fill="#e2e8f0" stroke="#475569" stroke-width="3" stroke-linejoin="round"/>
  <rect x="26" y="56" width="16" height="16" fill="#94a3b8"/>
  <rect x="56" y="56" width="16" height="16" fill="#94a3b8"/>
  <rect x="86" y="56" width="16" height="16" fill="#94a3b8"/>
</svg>`

const END_USER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 84">
  <circle cx="44" cy="20" r="15" fill="#e0e7ff" stroke="#4338ca" stroke-width="3"/>
  <path d="M12 78 V66 a32 32 0 0 1 64 0 V78 Z" fill="#e0e7ff" stroke="#4338ca" stroke-width="3" stroke-linejoin="round"/>
</svg>`

const COMPUTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 84">
  <rect x="10" y="8" width="90" height="52" rx="4" fill="#cffafe" stroke="#0e7490" stroke-width="3"/>
  <rect x="18" y="16" width="74" height="36" fill="#a5f3fc"/>
  <rect x="46" y="60" width="18" height="12" fill="#67e8f9" stroke="#0e7490" stroke-width="3"/>
  <rect x="32" y="74" width="46" height="6" rx="3" fill="#0e7490"/>
</svg>`

const SERVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 88">
  <rect x="18" y="6" width="54" height="76" rx="5" fill="#f1f5f9" stroke="#334155" stroke-width="3"/>
  <rect x="26" y="16" width="38" height="12" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
  <rect x="26" y="34" width="38" height="12" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
  <circle cx="32" cy="62" r="3.5" fill="#22c55e"/>
  <circle cx="44" cy="62" r="3.5" fill="#22c55e"/>
  <circle cx="56" cy="62" r="3.5" fill="#eab308"/>
</svg>`

const PRINTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 88">
  <rect x="26" y="8" width="58" height="22" fill="#e2e8f0" stroke="#475569" stroke-width="3"/>
  <rect x="12" y="30" width="86" height="34" rx="5" fill="#f1f5f9" stroke="#475569" stroke-width="3"/>
  <rect x="30" y="56" width="50" height="26" fill="#ffffff" stroke="#475569" stroke-width="3"/>
  <circle cx="86" cy="46" r="3.5" fill="#22c55e"/>
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
    value: 'store',
    label: 'Store',
    render: 'image',
    svg: SUPERMARKET_SVG,
    width: 128,
    height: 80,
    textMaxWidth: '130px',
    Icon: Store,
    iconColor: 'text-orange-600',
  },
  {
    value: 'factory',
    label: 'Factory',
    render: 'image',
    svg: FACTORY_SVG,
    width: 130,
    height: 84,
    textMaxWidth: '130px',
    Icon: Factory,
    iconColor: 'text-slate-600',
  },
  {
    value: 'end-user',
    label: 'End User',
    render: 'image',
    svg: END_USER_SVG,
    width: 92,
    height: 88,
    textMaxWidth: '130px',
    Icon: PersonStanding,
    iconColor: 'text-indigo-600',
  },
  {
    value: 'computer',
    label: 'Computer',
    render: 'image',
    svg: COMPUTER_SVG,
    width: 116,
    height: 88,
    textMaxWidth: '130px',
    Icon: Monitor,
    iconColor: 'text-cyan-600',
  },
  {
    value: 'server',
    label: 'Server',
    render: 'image',
    svg: SERVER_SVG,
    width: 90,
    height: 92,
    textMaxWidth: '130px',
    Icon: Server,
    iconColor: 'text-slate-700',
  },
  {
    value: 'printer',
    label: 'Printer',
    render: 'image',
    svg: PRINTER_SVG,
    width: 112,
    height: 90,
    textMaxWidth: '130px',
    Icon: Printer,
    iconColor: 'text-slate-500',
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
