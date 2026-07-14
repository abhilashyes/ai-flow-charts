import { useState } from 'react'
import { Plus } from 'lucide-react'
import ProcessList from './ProcessList'
import ProcessForm from './ProcessForm'

export default function ProcessesTab({ vc, editMode, editModeLabel }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null) // process being edited
  const processes = vc.chain.processes.filter((p) => p.mode === editMode)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {editModeLabel} processes ({processes.length})
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
          processes={vc.chain.processes}
          editMode={editMode}
          onSubmit={vc.addProcess}
          onClose={() => setShowForm(false)}
        />
      )}

      {editing && (
        <ProcessForm
          processes={vc.chain.processes}
          editMode={editMode}
          initial={editing}
          onSubmit={(values) => vc.editProcess(editing.id, values)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
