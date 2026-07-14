import { useState } from 'react'
import { Plus } from 'lucide-react'
import ConnectorList from './ConnectorList'
import ConnectorForm from './ConnectorForm'

export default function ConnectorsTab({ vc, editMode, editModeLabel }) {
  const [showForm, setShowForm] = useState(false)
  const connectors = vc.chain.connectors.filter((c) => c.mode === editMode)
  const processMap = new Map(vc.chain.processes.map((p) => [p.id, p]))

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {editModeLabel} connectors ({connectors.length})
        </span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={14} /> Add Connector
        </button>
      </div>
      <div className="vcm-scrollbar flex-1 overflow-y-auto px-3 pb-3">
        <ConnectorList
          connectors={connectors}
          processMap={processMap}
          selected={vc.selected}
          onSelect={vc.setSelected}
          onDelete={vc.deleteConnector}
          onUpdate={vc.updateConnector}
        />
      </div>

      {showForm && (
        <ConnectorForm
          connectors={vc.chain.connectors}
          processes={vc.chain.processes}
          editMode={editMode}
          onSubmit={vc.addConnector}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
