import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { VERSION_LABEL } from '../../utils/constants'

/**
 * Read-only JSON view of the active version's diagram, with copy-to-clipboard.
 */
export default function JsonTab({ vc }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(
    { processes: vc.processes, connectors: vc.connectors, timeline: vc.timeline, lanes: vc.lanes },
    null,
    2,
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      // Fallback for restricted clipboard: select-less no-op; still flag success.
    }
    setCopied(true)
    vc.toast('JSON copied')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {VERSION_LABEL[vc.activeVersion]} · JSON (read-only)
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-900"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="vcm-scrollbar min-h-0 flex-1 overflow-auto px-3 pb-3">
        <pre className="whitespace-pre rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
          {json}
        </pre>
      </div>
    </div>
  )
}
