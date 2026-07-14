import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Share2 } from 'lucide-react'

export default function Header({ onBack, name, onRename }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name ?? '')
  const inputRef = useRef(null)

  useEffect(() => setDraft(name ?? ''), [name])
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== name) onRename?.(next)
    else setDraft(name ?? '')
  }

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      {onBack && (
        <button
          onClick={onBack}
          title="Back to all flows"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <Share2 size={16} />
      </div>
      <div className="min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(name ?? '')
                setEditing(false)
              }
            }}
            className="w-64 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-[15px] font-bold text-slate-800 outline-none ring-1 ring-blue-200"
          />
        ) : (
          <h1
            onClick={() => onRename && setEditing(true)}
            title={onRename ? 'Click to rename' : undefined}
            className={`truncate text-[15px] font-bold leading-tight text-slate-800 ${
              onRename ? 'cursor-text rounded px-1 -mx-1 hover:bg-slate-100' : ''
            }`}
          >
            {name ?? 'Value Chain Mapper'}
          </h1>
        )}
        <p className="truncate text-[11px] leading-tight text-slate-400">
          Model, visualize and compare Material &amp; Information Flow charts
        </p>
      </div>
    </header>
  )
}
