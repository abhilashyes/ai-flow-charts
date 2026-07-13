import { Undo2, Redo2 } from 'lucide-react'
import { MODE_OPTIONS } from '../../utils/constants'

export default function SettingsTab({ vc }) {
  const { chain, currentMode, setCurrentMode, canUndo, canRedo, undo, redo } = vc

  const stdCount = chain.processes.filter((p) => p.mode === 'standard').length
  const idealCount = chain.processes.filter((p) => p.mode === 'ideal').length

  return (
    <div className="vcm-scrollbar h-full overflow-y-auto px-3 py-3">
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Display Mode</h3>
        <div className="space-y-1.5">
          {MODE_OPTIONS.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition ${
                currentMode === m.value
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="mode"
                className="mt-0.5 accent-blue-600"
                checked={currentMode === m.value}
                onChange={() => setCurrentMode(m.value)}
              />
              <span>
                <span className="block text-[13px] font-semibold text-slate-700">{m.label}</span>
                <span className="block text-[11px] text-slate-400">{m.help}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Actions</h3>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <Undo2 size={14} /> Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <Redo2 size={14} /> Redo
          </button>
        </div>
      </section>

      <section className="mt-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Current State</h3>
        <dl className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-[12px]">
          <Row label="Value chain" value={chain.name} />
          <Row label="Standard processes" value={stdCount} />
          <Row label="Ideal processes" value={idealCount} />
          <Row label="Total connectors" value={chain.connectors.length} />
          <Row label="Active mode" value={currentMode} />
        </dl>
      </section>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold capitalize text-slate-700">{value}</dd>
    </div>
  )
}
