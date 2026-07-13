import { Square, Diamond, Trash2, Clock, Users } from 'lucide-react'

export default function ProcessList({ processes, selected, onSelect, onDelete }) {
  if (processes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[12px] text-slate-400">
        No processes yet. Click “Add Process” to create one.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {processes.map((p) => {
        const isSel = selected?.kind === 'process' && selected.id === p.id
        const Icon = p.type === 'diamond' ? Diamond : Square
        return (
          <div
            key={p.id}
            onClick={() => onSelect({ kind: 'process', id: p.id })}
            className={`group cursor-pointer rounded-lg border p-2.5 transition ${
              isSel ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">{p.refNum}</span>
              <Icon size={14} className={p.type === 'diamond' ? 'text-orange-500' : 'text-blue-500'} />
              <span className="flex-1 truncate text-[13px] font-semibold text-slate-700">{p.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(p.id)
                }}
                title="Delete process"
                className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-1.5 flex gap-3 pl-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {p.stdTime}m
                <span className="text-slate-300">/</span>
                <span className="text-emerald-600">{p.idealTime}m</span>
              </span>
              <span className="flex items-center gap-1">
                <Users size={11} /> {p.stdRes}
                <span className="text-slate-300">/</span>
                <span className="text-emerald-600">{p.idealRes}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
