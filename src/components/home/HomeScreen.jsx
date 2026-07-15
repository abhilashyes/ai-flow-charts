import { useState } from 'react'
import { Share2, Plus, Search, LogOut, Loader2 } from 'lucide-react'
import { useFlows } from '../../hooks/useFlows'
import FlowCard from './FlowCard'
import { Modal, TextField, FormActions } from '../formControls'

export default function HomeScreen({ onOpen, user, onSignOut }) {
  const { flows, loading, createFlow, renameFlow, duplicateFlow, removeFlow } = useFlows()
  const [query, setQuery] = useState('')
  const [renaming, setRenaming] = useState(null) // flow being renamed
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // flow to delete

  const filtered = flows.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <Share2 size={18} />
        </div>
        <div className="flex-1">
          <h1 className="text-[16px] font-bold leading-tight text-slate-800">Value Chain Mapper</h1>
          <p className="text-[11px] leading-tight text-slate-400">Your flows &amp; diagrams</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={16} /> New flow
        </button>
        {onSignOut && (
          <button
            onClick={onSignOut}
            title={user ? `Sign out ${user.name}` : 'Sign out'}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={15} /> Sign out
          </button>
        )}
      </header>

      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-white px-5 py-2.5">
        <div className="relative max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flows…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="vcm-scrollbar flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFlows={flows.length > 0} onCreate={() => setCreating(true)} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            <NewFlowTile onClick={() => setCreating(true)} />
            {filtered.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                onOpen={onOpen}
                onRename={setRenaming}
                onDuplicate={(id) => duplicateFlow(id)}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      {creating && (
        <NameDialog
          title="New flow"
          initial=""
          submitLabel="Create"
          onSubmit={async (name) => {
            const id = await createFlow(name)
            setCreating(false)
            onOpen(id)
          }}
          onClose={() => setCreating(false)}
        />
      )}

      {renaming && (
        <NameDialog
          title="Rename flow"
          initial={renaming.name}
          submitLabel="Save"
          onSubmit={(name) => {
            renameFlow(renaming.id, name)
            setRenaming(null)
          }}
          onClose={() => setRenaming(null)}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete flow" subtitle={confirmDelete.name} onClose={() => setConfirmDelete(null)}>
          <p className="text-[13px] text-slate-600">
            This permanently deletes <b>{confirmDelete.name}</b> and its diagram. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                removeFlow(confirmDelete.id)
                setConfirmDelete(null)
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function NewFlowTile({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[196px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/50 text-slate-400 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 transition group-hover:bg-blue-100">
        <Plus size={22} />
      </div>
      <span className="text-[13px] font-semibold">New flow</span>
    </button>
  )
}

function EmptyState({ hasFlows, onCreate }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Share2 size={26} />
      </div>
      <h2 className="text-[15px] font-bold text-slate-700">{hasFlows ? 'No matching flows' : 'No flows yet'}</h2>
      <p className="max-w-xs text-[13px] text-slate-400">
        {hasFlows ? 'Try a different search term.' : 'Create your first value chain to get started.'}
      </p>
      {!hasFlows && (
        <button
          onClick={onCreate}
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={16} /> New flow
        </button>
      )}
    </div>
  )
}

function NameDialog({ title, initial, submitLabel, onSubmit, onClose }) {
  const [name, setName] = useState(initial)
  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name)
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <TextField label="Flow name" value={name} onChange={setName} placeholder="e.g. Order-to-Cash" autoFocus />
        <FormActions onCancel={onClose} submitLabel={submitLabel} />
      </form>
    </Modal>
  )
}
