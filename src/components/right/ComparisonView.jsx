import { useState } from 'react'
import InteractiveDiagram from './InteractiveDiagram'
import { VERSIONS } from '../../utils/constants'
import { formatDuration, totalStdSeconds } from '../../utils/time'

const TONE = {
  current: 'bg-slate-100 text-slate-600',
  target: 'bg-blue-100 text-blue-700',
  ideal: 'bg-emerald-100 text-emerald-700',
}

function Pane({ flow, version, onVersion }) {
  const chain = flow.versions[version]
  const total = formatDuration(totalStdSeconds(chain.processes))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <select
            value={version}
            onChange={(e) => onVersion(e.target.value)}
            className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide outline-none ${TONE[version]}`}
          >
            {VERSIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-slate-500">
          {chain.processes.length} steps · <b className="text-slate-700">{total}</b> std time
        </span>
      </div>
      <div className="min-h-0 flex-1 bg-slate-50">
        <InteractiveDiagram
          processes={chain.processes}
          connectors={chain.connectors}
          timeline={chain.timeline}
          selected={null}
          onSelect={() => {}}
        />
      </div>
    </div>
  )
}

/**
 * Stacked top/bottom comparison. Each pane independently picks which of the
 * three versions it shows (defaults: top = Current, bottom = Target).
 */
export default function ComparisonView({ flow }) {
  const [topV, setTopV] = useState('current')
  const [bottomV, setBottomV] = useState('target')

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Pane flow={flow} version={topV} onVersion={setTopV} />
      <Pane flow={flow} version={bottomV} onVersion={setBottomV} />
    </div>
  )
}
