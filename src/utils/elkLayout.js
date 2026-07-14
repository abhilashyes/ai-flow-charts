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
      // Default flow is left-to-right.
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
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
 * Turn an absolute ELK poly-line into Cytoscape `segments` control values.
 * We feed ALL ELK points (including the border start/end) as control points,
 * expressed relative to the source→target centre line. Cytoscape clips the
 * centre→port stubs inside the node shapes, so the visible path is exactly
 * ELK's orthogonal poly-line — every leg is a true right angle.
 * Returns { segW, segD } or null if there is nothing to route.
 */
export function edgeGeometry(points, sourceCenter, targetCenter) {
  if (!points || points.length < 2) return null
  const dx = targetCenter.x - sourceCenter.x
  const dy = targetCenter.y - sourceCenter.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return null
  const len = Math.sqrt(len2)

  const weights = []
  const distances = []
  for (const b of points) {
    const t = ((b.x - sourceCenter.x) * dx + (b.y - sourceCenter.y) * dy) / len2
    const d = ((b.x - sourceCenter.x) * dy - (b.y - sourceCenter.y) * dx) / len
    weights.push(Math.min(0.9999, Math.max(0.0001, t)))
    distances.push(d)
  }

  return {
    segW: weights.map((n) => n.toFixed(4)).join(' '),
    segD: distances.map((n) => n.toFixed(2)).join(' '),
  }
}
