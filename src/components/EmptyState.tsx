import { useStore } from '../store'
import { buildSampleProject } from '../lib/sample'

export default function EmptyState() {
  const loadProject = useStore((s) => s.loadProject)
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="pointer-events-auto max-w-md rounded-xl border border-slate-200 bg-white/95 p-6 text-center shadow-lg backdrop-blur">
        <div className="mb-3 text-4xl">🏭→📦→🚚</div>
        <h3 className="text-lg font-bold text-slate-800">Start your value stream map</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Drag a <b>Process Box</b> and an <b>Inventory triangle</b> from the left palette onto the
          canvas, then connect them. Fill in cycle &amp; wait times in the inspector — the lead-time
          ladder and metrics update automatically.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => loadProject(buildSampleProject())}
            className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700"
          >
            Load a sample map
          </button>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Shortcuts: Del = delete · Ctrl+Z/Y = undo/redo · Ctrl+D = duplicate · Ctrl+C/V = copy/paste
        </p>
      </div>
    </div>
  )
}
