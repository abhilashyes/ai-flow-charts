import { STENCILS, type StencilDef } from '../lib/nodeFactory'
import type { VsmNodeType } from '../types'

const CATEGORY_LABELS: Record<StencilDef['category'], string> = {
  material: 'Material & Process',
  entity: 'Entities & Logistics',
  info: 'Information Flow',
  improvement: 'Improvement & Notes',
}

const ORDER: StencilDef['category'][] = ['material', 'entity', 'improvement']

export default function Palette() {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Stencils</h2>
        <p className="mt-0.5 text-[11px] text-slate-400">Drag onto the canvas</p>
      </div>
      <div className="vsm-scrollbar flex-1 overflow-y-auto px-2.5 py-2">
        {ORDER.map((cat) => (
          <div key={cat} className="mb-3">
            <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="flex flex-col gap-1.5">
              {STENCILS.filter((s) => s.category === cat).map((s) => (
                <StencilItem key={s.type} stencil={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 px-3 py-2 text-[10px] leading-snug text-slate-400">
        Tip: connect nodes by dragging from a handle. Set the line type in the top bar.
      </div>
    </aside>
  )
}

function StencilItem({ stencil }: { stencil: StencilDef }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/vsm-node', stencil.type)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={stencil.tooltip}
      className="group flex cursor-grab items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[12px] font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing"
    >
      <StencilGlyph type={stencil.type} />
      <span className="truncate">{stencil.label}</span>
    </div>
  )
}

/** Tiny preview glyph so each stencil is visually recognizable in the palette. */
function StencilGlyph({ type }: { type: VsmNodeType }) {
  const base = 'flex h-6 w-6 shrink-0 items-center justify-center rounded'
  switch (type) {
    case 'process':
      return <div className={`${base} border-2 border-vsm-processBorder bg-vsm-process`} />
    case 'inventory':
      return (
        <div className={base}>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderBottom: '15px solid #dc2626',
            }}
          />
        </div>
      )
    case 'supermarket':
      return <div className={`${base} border-2 border-r-0 border-slate-500`} />
    case 'fifo':
      return <div className={`${base} text-[8px] font-bold tracking-tight text-slate-500`}>FIFO</div>
    case 'safetyStock':
      return <div className={`${base} text-orange-500`}>▲▲</div>
    case 'customer':
    case 'supplier':
      return <div className={`${base} border-2 border-vsm-entityBorder bg-vsm-entity`} />
    case 'productionControl':
      return <div className={`${base} border-2 border-vsm-controlBorder bg-vsm-control`} />
    case 'truck':
      return <div className={base}>🚚</div>
    case 'kaizen':
      return <div className={`${base} text-pink-500`}>✸</div>
    case 'annotation':
      return <div className={`${base} bg-yellow-200 ring-1 ring-yellow-400`} />
    default:
      return <div className={base} />
  }
}
