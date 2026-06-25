import { useStore } from '../store'
import { fromSeconds, toSeconds, unitShort } from '../lib/units'
import type { VsmNode, TimeUnit } from '../types'

export default function Inspector() {
  const project = useStore((s) => s.project)
  const selectedId = useStore((s) => s.selectedNodeId)
  const active = project.states.find((s) => s.id === project.activeStateId)!
  const node = active.nodes.find((n) => n.id === selectedId) || null

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Inspector</h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {node ? `Editing: ${node.type}` : 'Select a node to edit its data'}
        </p>
      </div>
      <div className="vsm-scrollbar flex-1 overflow-y-auto px-3 py-3">
        {node ? <NodeFields node={node} unit={project.timeUnit} /> : <EmptyInspector />}
      </div>
    </aside>
  )
}

function EmptyInspector() {
  return (
    <div className="mt-8 text-center text-[12px] text-slate-400">
      <div className="mb-2 text-3xl">🛠️</div>
      Click any node on the canvas to edit its label and data fields here.
    </div>
  )
}

function NodeFields({ node, unit }: { node: VsmNode; unit: TimeUnit }) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const deleteSelection = useStore((s) => s.deleteSelection)
  const d = node.data as Record<string, unknown>

  const set = (patch: Record<string, unknown>) => updateNodeData(node.id, patch)

  return (
    <div className="space-y-3">
      <TextField label="Label" value={String(d.label ?? '')} onChange={(v) => set({ label: v })} />

      {node.type === 'process' && (
        <>
          <SectionTitle>Data Box</SectionTitle>
          <TimeField label="Cycle Time (C/T)" seconds={num(d.cycleTime)} unit={unit} onChange={(s) => set({ cycleTime: s })} />
          <TimeField label="Changeover (C/O)" seconds={num(d.changeover)} unit={unit} onChange={(s) => set({ changeover: s })} />
          <NumberField label="Uptime (%)" value={num(d.uptime)} onChange={(v) => set({ uptime: v })} max={100} />
          <NumberField label="# Operators" value={num(d.operators)} onChange={(v) => set({ operators: v })} />
          <NumberField label="Batch Size" value={num(d.batchSize)} onChange={(v) => set({ batchSize: v })} />
          <NumberField label="Shifts" value={num(d.shifts)} onChange={(v) => set({ shifts: v })} />
          <Hint>Cycle time contributes to Value-Added time on the ladder.</Hint>
        </>
      )}

      {node.type === 'inventory' && (
        <>
          <SectionTitle>Inventory</SectionTitle>
          <NumberField label="Quantity" value={num(d.quantity)} onChange={(v) => set({ quantity: v })} />
          <TimeField label="Wait Time" seconds={num(d.waitTime)} unit={unit} onChange={(s) => set({ waitTime: s })} />
          <Hint>Wait time contributes to Non-Value-Added time (stagnation) on the ladder.</Hint>
        </>
      )}

      {(node.type === 'supermarket' || node.type === 'fifo' || node.type === 'safetyStock') && (
        <NumberField label="Quantity / Max" value={num(d.quantity)} onChange={(v) => set({ quantity: v })} />
      )}

      {node.type === 'annotation' && (
        <TextAreaField label="Note text" value={String(d.text ?? '')} onChange={(v) => set({ text: v })} />
      )}

      <button
        onClick={deleteSelection}
        className="mt-4 w-full rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-600 transition hover:bg-red-100"
      >
        Delete node
      </button>
    </div>
  )
}

const num = (v: unknown) => Number(v) || 0

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{children}</div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded bg-slate-50 px-2 py-1 text-[10px] leading-snug text-slate-500">{children}</p>
}

function fieldShell(label: string, control: React.ReactNode) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-medium text-slate-600">{label}</span>
      {control}
    </label>
  )
}

const inputCls =
  'w-full rounded-md border border-slate-300 px-2 py-1 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300'

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return fieldShell(label, <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />)
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return fieldShell(
    label,
    <textarea className={`${inputCls} resize-none`} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />,
  )
}

function NumberField({
  label,
  value,
  onChange,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
}) {
  return fieldShell(
    label,
    <input
      type="number"
      min={0}
      max={max}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
    />,
  )
}

/** Displays a canonical-seconds value in the active unit; converts on edit. */
function TimeField({
  label,
  seconds,
  unit,
  onChange,
}: {
  label: string
  seconds: number
  unit: TimeUnit
  onChange: (seconds: number) => void
}) {
  const display = fromSeconds(seconds, unit)
  const rounded = Math.round(display * 1000) / 1000
  return fieldShell(
    label,
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        step="any"
        className={inputCls}
        value={rounded}
        onChange={(e) => onChange(toSeconds(Math.max(0, Number(e.target.value)), unit))}
      />
      <span className="w-8 shrink-0 text-[11px] text-slate-400">{unitShort(unit)}</span>
    </div>,
  )
}
