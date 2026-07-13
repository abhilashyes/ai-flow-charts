import InteractiveDiagram from './InteractiveDiagram'

function Pane({ title, tone, processes, connectors, mode, selected, onSelect }) {
  const totalTime = processes.reduce((s, p) => s + (mode === 'ideal' ? p.idealTime : p.stdTime), 0)
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tone}`}>{title}</span>
        <span className="text-[11px] text-slate-500">
          {processes.length} steps · <b className="text-slate-700">{totalTime}m</b> process time
        </span>
      </div>
      <div className="min-h-0 flex-1 bg-slate-50">
        <InteractiveDiagram
          processes={processes}
          connectors={connectors}
          mode={mode}
          selected={selected}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}

export default function ComparisonView({ chain, selected, onSelect }) {
  const stdP = chain.processes.filter((p) => p.mode === 'standard')
  const stdC = chain.connectors.filter((c) => c.mode === 'standard')
  const idealP = chain.processes.filter((p) => p.mode === 'ideal')
  const idealC = chain.connectors.filter((c) => c.mode === 'ideal')

  return (
    <div className="flex h-full gap-3 p-3">
      <Pane
        title="Standard"
        tone="bg-slate-100 text-slate-600"
        processes={stdP}
        connectors={stdC}
        mode="standard"
        selected={selected}
        onSelect={onSelect}
      />
      <Pane
        title="Ideal"
        tone="bg-emerald-100 text-emerald-700"
        processes={idealP}
        connectors={idealC}
        mode="ideal"
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  )
}
