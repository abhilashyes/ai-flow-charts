import { Pencil, Trash2, ArrowRight, Clock, Flag } from 'lucide-react'
import { conveyanceOf } from '../../utils/conveyance'
import { formatTime } from '../../utils/time'

const SIDES = [
  ['auto', 'Auto'],
  ['top', 'Top'],
  ['bottom', 'Bottom'],
  ['left', 'Left'],
  ['right', 'Right'],
]

export default function ConnectorList({ connectors, processMap, selected, onSelect, onEdit, onDelete, onUpdate }) {
  if (connectors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[12px] text-slate-400">
        No connectors yet. Click “Add Connector” to link two processes.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {connectors.map((c) => {
        const isSel = selected?.kind === 'connector' && selected.id === c.id
        const src = processMap.get(c.source)
        const tgt = processMap.get(c.target)
        const isInfo = c.type === 'information-flow'
        const conv = conveyanceOf(c.modeOfConveyance)
        const ConvIcon = conv.Icon
        return (
          <div
            key={c.id}
            onClick={() => onSelect({ kind: 'connector', id: c.id })}
            className={`group cursor-pointer rounded-lg border p-2.5 transition ${
              isSel ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">{c.refNum}</span>
              <span
                title={isInfo ? 'Information flow' : 'Process flow'}
                className={`inline-block h-0 w-5 border-t-2 ${
                  isInfo ? 'border-dashed border-violet-500' : 'border-solid border-slate-500'
                }`}
              />
              <span className="flex-1 truncate text-[12px] font-medium text-slate-600">
                {src?.refNum ?? '?'} <ArrowRight size={11} className="inline" /> {tgt?.refNum ?? '?'}
              </span>
              {c.abnormal && (
                <span title="Abnormality flagged" className="shrink-0">
                  <Flag size={13} className="fill-red-500 text-red-500" />
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(c)
                }}
                title="Edit connector"
                className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(c.id)
                }}
                title="Delete connector"
                className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-3 pl-1 text-[11px] text-slate-500">
              <span
                title={conv.label}
                className={`inline-flex items-center rounded p-1 ${
                  isInfo ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <ConvIcon size={13} />
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} /> {formatTime(c.stdTime, c.stdTimeUnit)}
                <span className="text-slate-300">/</span>
                <span className="text-emerald-600">{formatTime(c.idealTime, c.idealTimeUnit)}</span>
              </span>
            </div>
            <div
              className="mt-1.5 flex items-center gap-2 pl-1 text-[11px] text-slate-500"
              onClick={(e) => e.stopPropagation()}
            >
              <label className="flex items-center gap-1">
                <span className="text-slate-400">Exit</span>
                <select
                  value={c.srcSide || 'auto'}
                  onChange={(e) => onUpdate?.(c.id, { srcSide: e.target.value })}
                  className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[11px] font-medium text-slate-600 outline-none focus:border-blue-400"
                >
                  {SIDES.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-slate-400">Entry</span>
                <select
                  value={c.tgtSide || 'auto'}
                  onChange={(e) => onUpdate?.(c.id, { tgtSide: e.target.value })}
                  className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[11px] font-medium text-slate-600 outline-none focus:border-blue-400"
                >
                  {SIDES.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
