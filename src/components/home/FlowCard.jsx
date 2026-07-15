import { useState } from 'react'
import { Square, Workflow, Clock, Layers, MoreVertical, Copy, Pencil, Trash2 } from 'lucide-react'
import { VERSIONS } from '../../utils/constants'

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

// A tiny decorative schematic so every card reads as a diagram at a glance.
function MiniPreview() {
  return (
    <svg viewBox="0 0 220 90" className="h-full w-full" aria-hidden="true">
      <line x1="46" y1="45" x2="96" y2="45" stroke="#94a3b8" strokeWidth="2" />
      <line x1="128" y1="45" x2="170" y2="45" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 4" />
      <rect x="14" y="31" width="32" height="28" rx="5" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <rect x="96" y="31" width="32" height="28" rx="5" fill="#fed7aa" stroke="#f97316" strokeWidth="2" transform="rotate(45 112 45)" />
      <rect x="174" y="31" width="32" height="28" rx="5" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
    </svg>
  )
}

export default function FlowCard({ flow, onOpen, onRename, onDuplicate, onDelete }) {
  const [menu, setMenu] = useState(false)
  // Counts reflect the Current version; the flow always carries all three.
  const current = flow.versions?.current ?? { processes: [], connectors: [] }
  const procCount = current.processes?.length ?? 0
  const connCount = current.connectors?.length ?? 0

  return (
    <div
      onClick={() => onOpen(flow.id)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      {/* Preview band */}
      <div className="flex h-28 items-center justify-center border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 px-6">
        <MiniPreview />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-slate-800">{flow.name}</h3>
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(flow.id)
              }}
              title="Duplicate flow"
              className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-blue-600 group-hover:opacity-100"
            >
              <Copy size={15} />
            </button>
            <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenu((v) => !v)
              }}
              title="More"
              className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenu(false) }} />
                <div
                  className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-[13px] shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MenuItem icon={Pencil} label="Rename" onClick={() => { setMenu(false); onRename(flow) }} />
                  <MenuItem icon={Copy} label="Duplicate" onClick={() => { setMenu(false); onDuplicate(flow.id) }} />
                  <MenuItem icon={Trash2} label="Delete" danger onClick={() => { setMenu(false); onDelete(flow) }} />
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
            title="Current, Target and Ideal versions"
          >
            <Layers size={11} /> {VERSIONS.length} versions
          </span>
        </div>

        <div className="mt-auto flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1" title="Processes (Current)">
            <Square size={12} className="text-blue-500" /> {procCount}
          </span>
          <span className="flex items-center gap-1" title="Connectors (Current)">
            <Workflow size={12} className="text-violet-500" /> {connCount}
          </span>
          <span className="ml-auto flex items-center gap-1 text-slate-400">
            <Clock size={11} /> {relativeTime(flow.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-slate-50 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
      }`}
    >
      <Icon size={13} /> {label}
    </button>
  )
}
