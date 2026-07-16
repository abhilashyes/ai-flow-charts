import { Mail, Webhook, Handshake, Truck, Database, Users, PackageCheck, HelpCircle } from 'lucide-react'
import { svgDataUri } from './shapes'

// A goods-carrying, LEFT/RIGHT-SYMMETRICAL boxcar for Physical Transport, so the
// symbol never implies a flow direction (the old 🚚 emoji faced left). Rendered
// as a small SVG image on the connector — see ConveyanceOverlay in the diagram.
const BOXCAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="12" y="14" width="40" height="24" rx="2" fill="#fbbf24" stroke="#92400e" stroke-width="2.5"/>
  <line x1="25" y1="14" x2="25" y2="38" stroke="#92400e" stroke-width="2"/>
  <line x1="32" y1="14" x2="32" y2="38" stroke="#92400e" stroke-width="2"/>
  <line x1="39" y1="14" x2="39" y2="38" stroke="#92400e" stroke-width="2"/>
  <rect x="8" y="38" width="48" height="6" rx="2" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2.5"/>
  <circle cx="18" cy="51" r="6" fill="#1e293b" stroke="#1d4ed8" stroke-width="2.5"/>
  <circle cx="46" cy="51" r="6" fill="#1e293b" stroke="#1d4ed8" stroke-width="2.5"/>
</svg>`

// Each mode of conveyance is represented by a symbol rather than a text label.
// `Icon` is a lucide component for React panels; `glyph` is an emoji used inside
// the Cytoscape canvas edge labels (text-only). A mode may instead carry `svg`
// (+`dataUri`), a crisp image drawn on the connector via an overlay — used where
// an emoji reads poorly (e.g. the directional truck).
export const CONVEYANCE = [
  { value: 'Email', label: 'Email', glyph: '📧', Icon: Mail },
  { value: 'API', label: 'API', glyph: '🔌', Icon: Webhook },
  { value: 'Manual Handoff', label: 'Manual Handoff', glyph: '🤝', Icon: Handshake },
  { value: 'Physical Transport', label: 'Physical Transport', glyph: '', Icon: Truck, svg: BOXCAR_SVG, dataUri: svgDataUri(BOXCAR_SVG) },
  { value: 'Database Sync', label: 'Database Sync', glyph: '🗄️', Icon: Database },
  { value: 'Meeting', label: 'Meeting', glyph: '👥', Icon: Users },
  { value: 'Conveyor', label: 'Conveyor', glyph: '📦', Icon: PackageCheck },
  { value: 'Other', label: 'Other', glyph: '•', Icon: HelpCircle },
]

const BY_VALUE = new Map(CONVEYANCE.map((c) => [c.value, c]))

export function conveyanceOf(value) {
  return BY_VALUE.get(value) ?? CONVEYANCE[CONVEYANCE.length - 1]
}
