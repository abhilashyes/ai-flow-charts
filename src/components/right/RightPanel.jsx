import InteractiveDiagram from './InteractiveDiagram'
import ComparisonView from './ComparisonView'
import { MODES } from '../../utils/constants'

export default function RightPanel({ vc }) {
  const { chain, currentMode, selected, setSelected } = vc

  if (currentMode === MODES.COMPARISON) {
    return (
      <div className="flex h-full flex-col">
        <ViewHeader label="Comparison — Standard vs Ideal" />
        <div className="min-h-0 flex-1">
          <ComparisonView chain={chain} selected={selected} onSelect={setSelected} />
        </div>
      </div>
    )
  }

  const mode = currentMode // 'standard' | 'ideal'
  const processes = chain.processes.filter((p) => p.mode === mode)
  const connectors = chain.connectors.filter((c) => c.mode === mode)
  const label = mode === 'ideal' ? 'Ideal Value Chain' : 'Standard Value Chain'

  return (
    <div className="flex h-full flex-col">
      <ViewHeader label={label} hint="Scroll to zoom · drag background to pan · click an element to select" />
      <div className="min-h-0 flex-1 bg-slate-50">
        <InteractiveDiagram
          processes={processes}
          connectors={connectors}
          mode={mode}
          selected={selected}
          onSelect={setSelected}
          timeline={vc.timeline}
          onColumnLabel={vc.setColumnLabel}
          onAddColumn={vc.addColumn}
          onRemoveColumn={vc.removeColumn}
        />
      </div>
    </div>
  )
}

function ViewHeader({ label, hint }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
      <h2 className="text-[13px] font-bold text-slate-700">{label}</h2>
      {hint && <span className="hidden text-[11px] text-slate-400 md:block">{hint}</span>}
    </div>
  )
}
