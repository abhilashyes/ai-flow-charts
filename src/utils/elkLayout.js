import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

// Node sizes must match the Cytoscape node styles so ELK reserves the right
// footprint when routing edges around shapes.
export function sizeOf(process) {
  return process.type === 'diamond' ? { w: 108, h: 108 } : { w: 136, h: 68 }
}

/**
 * Run ELK's layered layout with orthogonal (obstacle-avoiding) edge routing.
 * Returns node centre positions and, per edge, the absolute poly-line ELK chose
 * (start point → bend points → end point). Callers translate that poly-line into
 * Cytoscape segment weights/distances.
 */
export async function routeGraph(processes, connectors) {
  if (processes.length === 0) return { positions: new Map(), edges: new Map() }

  const ids = new Set(processes.map((p) => p.id))
  const conns = connectors.filter((c) => ids.has(c.source) && ids.has(c.target))

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.spacing.nodeNode': '55',
      'elk.spacing.edgeEdge': '18',
      'elk.spacing.edgeNode': '24',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '15',
      'elk.layered.spacing.edgeNodeBetweenLayers': '20',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.mergeEdges': 'false',
    },
    children: processes.map((p) => {
      const s = sizeOf(p)
      return { id: String(p.id), width: s.w, height: s.h }
    }),
    edges: conns.map((c) => ({
      id: `e${c.id}`,
      sources: [String(c.source)],
      targets: [String(c.target)],
    })),
  }

  const res = await elk.layout(graph)

  const positions = new Map()
  for (const ch of res.children ?? []) {
    positions.set(ch.id, { x: ch.x + ch.width / 2, y: ch.y + ch.height / 2 })
  }

  const edges = new Map()
  for (const e of res.edges ?? []) {
    const sec = e.sections?.[0]
    if (!sec) continue
    const pts = [sec.startPoint, ...(sec.bendPoints ?? []), sec.endPoint]
    edges.set(e.id, pts)
  }

  return { positions, edges }
}

/**
 * Convert an absolute ELK poly-line into Cytoscape `segments` control values,
 * expressed relative to the straight source→target centre line.
 * Returns { segW, segD } strings, or null when there are no interior bends.
 */
export function polylineToSegments(points, source, target) {
  const mids = points.slice(1, -1)
  if (mids.length === 0) return null

  const dx = target.x - source.x
  const dy = target.y - source.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return null
  const len = Math.sqrt(len2)

  const weights = []
  const distances = []
  for (const b of mids) {
    const t = ((b.x - source.x) * dx + (b.y - source.y) * dy) / len2
    // signed perpendicular distance (Cytoscape's positive = right of S→T)
    const d = ((b.x - source.x) * dy - (b.y - source.y) * dx) / len
    weights.push(Math.min(1, Math.max(0, t)))
    distances.push(d)
  }

  return { segW: weights.map((n) => n.toFixed(4)).join(' '), segD: distances.map((n) => n.toFixed(2)).join(' ') }
}
