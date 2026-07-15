import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import ConnectorList from './ConnectorList'
import ConnectorForm from './ConnectorForm'
import { VERSION_LABEL } from '../../utils/constants'

export default function ConnectorsTab({ vc }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null) // connector being edited
  const connectors = vc.connectors
  const processMap = new Map(vc.processes.map((p) => [p.id, p]))

  // Open the edit dialog when a connector is double-clicked on the diagram.
  const editReq = vc.editRequest
  useEffect(() => {
    if (editReq?.kind !== 'connector') return
    const conn = connectors.find((c) => c.id === editReq.id)
    if (conn) setEditing(conn)
    vc.clearEditRequest()
  }, [editReq]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {VERSION_LABEL[vc.activeVersion]} connectors ({connectors.length})
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
          onEdit={(c) => setEditing(c)}
          onDelete={vc.deleteConnector}
          onUpdate={vc.updateConnector}
        />
      </div>

      {showForm && (
        <ConnectorForm
          connectors={connectors}
          processes={vc.processes}
          onSubmit={vc.addConnector}
          onClose={() => setShowForm(false)}
        />
      )}

      {editing && (
        <ConnectorForm
          connectors={connectors}
          processes={vc.processes}
          initial={editing}
          onSubmit={(values) => vc.editConnector(editing.id, values)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
