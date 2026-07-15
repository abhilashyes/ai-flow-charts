import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import ProcessList from './ProcessList'
import ProcessForm from './ProcessForm'
import { VERSION_LABEL } from '../../utils/constants'

export default function ProcessesTab({ vc }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null) // process being edited
  const processes = vc.processes

  // Open the edit dialog when a process is double-clicked on the diagram.
  const editReq = vc.editRequest
  useEffect(() => {
    if (editReq?.kind !== 'process') return
    const proc = processes.find((p) => p.id === editReq.id)
    if (proc) setEditing(proc)
    vc.clearEditRequest()
  }, [editReq]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {VERSION_LABEL[vc.activeVersion]} processes ({processes.length})
        </span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={14} /> Add Process
        </button>
      </div>
      <div className="vcm-scrollbar flex-1 overflow-y-auto px-3 pb-3">
        <ProcessList
          processes={processes}
          selected={vc.selected}
          onSelect={vc.setSelected}
          onEdit={(p) => setEditing(p)}
          onDelete={vc.deleteProcess}
        />
      </div>

      {showForm && (
        <ProcessForm
          processes={processes}
          lanes={vc.lanes}
          onSubmit={vc.addProcess}
          onClose={() => setShowForm(false)}
        />
      )}

      {editing && (
        <ProcessForm
          processes={processes}
          lanes={vc.lanes}
          initial={editing}
          onSubmit={(values) => vc.editProcess(editing.id, values)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
