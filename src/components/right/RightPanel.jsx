import InteractiveDiagram from './InteractiveDiagram'
import { VERSION_LABEL } from '../../utils/constants'

export default function RightPanel({ vc }) {
  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        label={`${VERSION_LABEL[vc.activeVersion]} Value Chain`}
        hint="Scroll to zoom · drag background to pan · click an element to select"
      />
      <div className="min-h-0 flex-1 bg-slate-50">
        <InteractiveDiagram
          processes={vc.processes}
          connectors={vc.connectors}
          selected={vc.selected}
          onSelect={vc.setSelected}
          timeline={vc.timeline}
          onColumnLabel={vc.setColumnLabel}
          onAddColumn={vc.addColumn}
          onAddColumnStart={vc.addColumnStart}
          onRemoveColumn={vc.removeColumn}
          lanes={vc.lanes}
          onLaneLabel={vc.setLaneLabel}
          onAddLane={vc.addLane}
          onAddLaneTop={vc.addLaneStart}
          onRemoveLane={vc.removeLane}
          onLaneResize={vc.setLaneHeight}
          onLaneColor={vc.setLaneColor}
          onMoveNode={vc.setProcessPos}
          onEditRequest={vc.requestEdit}
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
