import { useState } from 'react'
import { useStore, useTemporal } from '../store'
import { TIME_UNITS, type VsmEdgeType } from '../types'
import { exportPng, exportPdf } from '../lib/export'
import { exportProjectJson, parseProjectJson, pickJsonFile } from '../lib/io'
import { buildSampleProject } from '../lib/sample'
import { computeMetrics } from '../lib/metrics'

const EDGE_OPTIONS: { value: VsmEdgeType; label: string }[] = [
  { value: 'push', label: 'Push (striped)' },
  { value: 'pull', label: 'Pull / withdrawal' },
  { value: 'manualInfo', label: 'Manual info' },
  { value: 'electronicInfo', label: 'Electronic info' },
]

export default function TopBar({
  compare,
  onToggleCompare,
}: {
  compare: boolean
  onToggleCompare: () => void
}) {
  const project = useStore((s) => s.project)
  const setTimeUnit = useStore((s) => s.setTimeUnit)
  const defaultEdgeType = useStore((s) => s.defaultEdgeType)
  const setDefaultEdgeType = useStore((s) => s.setDefaultEdgeType)
  const loadProject = useStore((s) => s.loadProject)
  const [busy, setBusy] = useState(false)

  const undo = useTemporal((s) => s.undo)
  const redo = useTemporal((s) => s.redo)
  const canUndo = useTemporal((s) => s.pastStates.length > 0)
  const canRedo = useTemporal((s) => s.futureStates.length > 0)

  const active = project.states.find((s) => s.id === project.activeStateId)!

  const doExportPng = async () => {
    setBusy(true)
    try {
      await exportPng(active)
    } finally {
      setBusy(false)
    }
  }
  const doExportPdf = async () => {
    setBusy(true)
    try {
      await exportPdf(active, computeMetrics(active), project.timeUnit)
    } finally {
      setBusy(false)
    }
  }
  const doImport = async () => {
    try {
      const text = await pickJsonFile()
      loadProject(parseProjectJson(text))
    } catch (e) {
      alert(`Could not import: ${(e as Error).message}`)
    }
  }

  return (
    <header className="flex flex-col border-b border-slate-200 bg-white">
      {/* Row 1: brand + global controls */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
            V
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-800">VSM Studio</div>
            <div className="text-[10px] text-slate-400">Value Stream Mapping</div>
          </div>
        </div>

        <div className="mx-1 h-7 w-px bg-slate-200" />

        {/* Time unit */}
        <label className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <span className="font-medium">Time unit</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400"
            value={project.timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as typeof project.timeUnit)}
          >
            {TIME_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        {/* Connection type */}
        <label className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <span className="font-medium">New line</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400"
            value={defaultEdgeType}
            onChange={(e) => setDefaultEdgeType(e.target.value as VsmEdgeType)}
          >
            {EDGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mx-1 h-7 w-px bg-slate-200" />

        {/* Undo / redo */}
        <div className="flex items-center gap-1">
          <IconBtn title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={() => undo()}>
            ↶
          </IconBtn>
          <IconBtn title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => redo()}>
            ↷
          </IconBtn>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Btn onClick={() => loadProject(buildSampleProject())}>Load sample</Btn>
          <Btn onClick={onToggleCompare} active={compare}>
            {compare ? 'Edit map' : 'Compare states'}
          </Btn>
          <div className="mx-1 h-7 w-px bg-slate-200" />
          <Btn onClick={doExportPng} disabled={busy}>
            PNG
          </Btn>
          <Btn onClick={doExportPdf} disabled={busy}>
            PDF
          </Btn>
          <Btn onClick={() => exportProjectJson(project)}>Save JSON</Btn>
          <Btn onClick={doImport}>Load JSON</Btn>
        </div>
      </div>

      {/* Row 2: state tabs */}
      <StateTabs />
    </header>
  )
}

function StateTabs() {
  const project = useStore((s) => s.project)
  const setActiveState = useStore((s) => s.setActiveState)
  const addState = useStore((s) => s.addState)
  const removeState = useStore((s) => s.removeState)
  const renameState = useStore((s) => s.renameState)
  const duplicateAsFuture = useStore((s) => s.duplicateStateAsFuture)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-1.5">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        States
      </span>
      {project.states.map((s) => {
        const isActive = s.id === project.activeStateId
        return (
          <div
            key={s.id}
            className={`group flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] ${
              isActive
                ? 'border-blue-300 bg-blue-50 font-semibold text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {editingId === s.id ? (
              <input
                autoFocus
                defaultValue={s.name}
                className="w-24 rounded bg-white px-1 text-[12px] outline-none ring-1 ring-blue-400"
                onBlur={(e) => {
                  renameState(s.id, e.target.value || s.name)
                  setEditingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditingId(null)
                }}
              />
            ) : (
              <button onClick={() => setActiveState(s.id)} onDoubleClick={() => setEditingId(s.id)}>
                {s.name}
              </button>
            )}
            {project.states.length > 1 && (
              <button
                title="Delete state"
                className="text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                onClick={() => {
                  if (confirm(`Delete state "${s.name}"?`)) removeState(s.id)
                }}
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      <button
        onClick={() => addState()}
        title="Add empty state"
        className="rounded-md border border-dashed border-slate-300 px-2 py-1 text-[12px] text-slate-500 hover:border-blue-300 hover:text-blue-600"
      >
        + State
      </button>
      <button
        onClick={duplicateAsFuture}
        title="Duplicate the active state as a new future state"
        className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[12px] font-medium text-emerald-700 hover:bg-emerald-100"
      >
        ⎘ Duplicate as future
      </button>
    </div>
  )
}

function Btn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition disabled:opacity-40 ${
        active
          ? 'border-blue-500 bg-blue-600 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-base text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  )
}
