// Typed abnormality indicators for processes and connectors.
//
// An element's abnormality is a TYPE — 'none' | 'excess' | 'shortage' — rendered
// as a red, striped parabola that floats above the shape:
//   - excess  → dome  (downward parabola ∩)  "Excess Stagnation"
//   - shortage → bowl (upward parabola U)     "Shortage Stagnation"
//
// The legacy boolean `abnormal` is kept in sync (`abnormal === (type !== 'none')`)
// so anything still reading it keeps working. See docs/INTEGRATIONS.md.
import { svgDataUri } from './shapes'

// Each glyph is a STANDALONE svg (its stripe <pattern> is inlined) so it works as
// an <img>/background image with no external defs to resolve.
const glyphSvg = (path) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><pattern id="s" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="7" height="7" fill="#fee2e2"/><line x1="0" y1="0" x2="0" y2="7" stroke="#dc2626" stroke-width="3.6"/>
  </pattern></defs>
  <path d="${path}" fill="url(#s)" stroke="#991b1b" stroke-width="4" stroke-linejoin="round"/>
</svg>`

const EXCESS_SVG = glyphSvg('M7 51 Q32 -19 57 51 Z') // dome (peak up)
const SHORTAGE_SVG = glyphSvg('M7 13 Q32 83 57 13 Z') // bowl (opening up)

const REGISTRY = {
  excess: { value: 'excess', label: 'Excess Stagnation', color: '#991b1b', svg: EXCESS_SVG, dataUri: svgDataUri(EXCESS_SVG) },
  shortage: { value: 'shortage', label: 'Shortage Stagnation', color: '#991b1b', svg: SHORTAGE_SVG, dataUri: svgDataUri(SHORTAGE_SVG) },
}

// Options for the form's Abnormality select.
export const ABNORMALITY_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'excess', label: 'Excess Stagnation' },
  { value: 'shortage', label: 'Shortage Stagnation' },
]

// Resolve an element's abnormality type with legacy fallback (boolean `abnormal`
// with no type → 'excess'; otherwise 'none').
export function abnormalityType(el) {
  return el?.abnormalityType ?? (el?.abnormal ? 'excess' : 'none')
}

// The rendering descriptor for a type, or null for 'none'/unknown.
export function abnormalityOf(type) {
  return REGISTRY[type] ?? null
}
