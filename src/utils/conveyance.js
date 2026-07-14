import { Mail, Webhook, Handshake, Truck, Database, Users, PackageCheck, HelpCircle } from 'lucide-react'

// Each mode of conveyance is represented by a symbol rather than a text label.
// `Icon` is a lucide component for React panels; `glyph` is an emoji used inside
// the Cytoscape canvas edge labels (which can only render plain text).
export const CONVEYANCE = [
  { value: 'Email', label: 'Email', glyph: '📧', Icon: Mail },
  { value: 'API', label: 'API', glyph: '🔌', Icon: Webhook },
  { value: 'Manual Handoff', label: 'Manual Handoff', glyph: '🤝', Icon: Handshake },
  { value: 'Physical Transport', label: 'Physical Transport', glyph: '🚚', Icon: Truck },
  { value: 'Database Sync', label: 'Database Sync', glyph: '🗄️', Icon: Database },
  { value: 'Meeting', label: 'Meeting', glyph: '👥', Icon: Users },
  { value: 'Conveyor', label: 'Conveyor', glyph: '📦', Icon: PackageCheck },
  { value: 'Other', label: 'Other', glyph: '•', Icon: HelpCircle },
]

const BY_VALUE = new Map(CONVEYANCE.map((c) => [c.value, c]))

export function conveyanceOf(value) {
  return BY_VALUE.get(value) ?? CONVEYANCE[CONVEYANCE.length - 1]
}
