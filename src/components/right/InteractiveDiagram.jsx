import { useEffect, useMemo, useRef } from 'react'
import cytoscape from 'cytoscape'

// Cytoscape stylesheet. Rectangles = tasks (blue), diamonds = decisions
// (orange). Process-flow edges are solid, information-flow edges dashed.
const cyStyle = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'font-size': 9,
      'font-weight': 600,
      color: '#334155',
      'border-width': 2,
      'text-outline-color': '#ffffff',
      'text-outline-width': 2,
    },
  },
  {
    selector: 'node[shape = "rectangle"]',
    style: {
      shape: 'round-rectangle',
      'background-color': '#dbeafe',
      'border-color': '#3b82f6',
      width: 100,
      height: 60,
    },
  },
  {
    selector: 'node[shape = "diamond"]',
    style: {
      shape: 'diamond',
      'background-color': '#ffedd5',
      'border-color': '#f97316',
      width: 74,
      height: 74,
    },
  },
  {
    selector: 'edge',
    style: {
      label: 'data(label)',
      'font-size': 8,
      'font-weight': 500,
      color: '#475569',
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.9,
      'text-background-padding': 3,
      'text-background-shape': 'roundrectangle',
      // Orthogonal "elbow" routing (right-angle segments), not diagonal lines.
      'curve-style': 'taxi',
      'taxi-direction': 'downward',
      'taxi-turn': '50%',
      'taxi-turn-min-distance': 8,
      width: 2,
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
    },
  },
  {
    selector: 'edge[etype = "process-flow"]',
    style: {
      'line-color': '#64748b',
      'target-arrow-color': '#64748b',
      'line-style': 'solid',
    },
  },
  {
    selector: 'edge[etype = "information-flow"]',
    style: {
      'line-color': '#8b5cf6',
      'target-arrow-color': '#8b5cf6',
      'line-style': 'dashed',
    },
  },
  {
    selector: '.sel',
    style: {
      'border-color': '#2563eb',
      'border-width': 4,
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      'z-index': 999,
    },
  },
]

function buildElements(processes, connectors, mode) {
  const timeKey = mode === 'ideal' ? 'idealTime' : 'stdTime'
  const resKey = mode === 'ideal' ? 'idealRes' : 'stdRes'
  const ids = new Set(processes.map((p) => p.id))

  const nodes = processes.map((p) => ({
    data: {
      id: String(p.id),
      shape: p.type === 'diamond' ? 'diamond' : 'rectangle',
      label: `${p.refNum}  ${p.name}\n${p[timeKey]}m · ${p[resKey]} res`,
    },
  }))

  const edges = connectors
    .filter((c) => ids.has(c.source) && ids.has(c.target))
    .map((c) => ({
      data: {
        id: `e${c.id}`,
        cid: c.id,
        source: String(c.source),
        target: String(c.target),
        etype: c.type,
        label: `${c.refNum} · ${c.modeOfConveyance}\n${c[timeKey]}m`,
      },
    }))

  return [...nodes, ...edges]
}

export default function InteractiveDiagram({ processes, connectors, mode, selected, onSelect }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const elements = useMemo(() => buildElements(processes, connectors, mode), [processes, connectors, mode])
  const elementsKey = useMemo(() => JSON.stringify(elements), [elements])

  // Init once.
  useEffect(() => {
    const cy = cytoscape({
      container: containerRef.current,
      style: cyStyle,
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.25,
      boxSelectionEnabled: false,
      autoungrabify: false,
    })
    cyRef.current = cy
    cy.on('tap', 'node', (evt) => onSelectRef.current?.({ kind: 'process', id: Number(evt.target.id()) }))
    cy.on('tap', 'edge', (evt) => onSelectRef.current?.({ kind: 'connector', id: Number(evt.target.data('cid')) }))
    cy.on('tap', (evt) => {
      if (evt.target === cy) onSelectRef.current?.(null)
    })

    const ro = new ResizeObserver(() => {
      cy.resize()
      cy.fit(undefined, 30)
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      cy.destroy()
      cyRef.current = null
    }
  }, [])

  // Rebuild elements + layout whenever the data changes.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.elements().remove()
    cy.add(elements)
    if (elements.length > 0) {
      cy.layout({
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.15,
        padding: 24,
        animate: false,
      }).run()
      cy.fit(undefined, 30)
    }
  }, [elementsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reflect external selection as a highlight.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.elements().removeClass('sel')
    if (selected?.kind === 'process') cy.getElementById(String(selected.id)).addClass('sel')
    if (selected?.kind === 'connector') cy.getElementById(`e${selected.id}`).addClass('sel')
  }, [selected, elementsKey])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {processes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] text-slate-400">No processes in this view yet.</p>
        </div>
      )}
    </div>
  )
}
