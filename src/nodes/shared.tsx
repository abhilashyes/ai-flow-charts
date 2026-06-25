import { Handle, Position } from '@xyflow/react'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

/** Connection handles on all four sides so edges route naturally. */
export function FourHandles() {
  return (
    <>
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Bottom} id="b" />
    </>
  )
}

/** Double-click to edit a node's label inline. */
export function EditableLabel({
  id,
  value,
  className = '',
  placeholder = 'Label',
}: {
  id: string
  value: string
  className?: string
  placeholder?: string
}) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      requestAnimationFrame(() => ref.current?.select())
    }
  }, [editing, value])

  if (editing) {
    return (
      <input
        ref={ref}
        className={`nodrag w-full rounded bg-white/90 px-1 text-center outline-none ring-1 ring-blue-400 ${className}`}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          updateNodeData(id, { label: draft })
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateNodeData(id, { label: draft })
            setEditing(false)
          } else if (e.key === 'Escape') {
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <span
      className={`block cursor-text ${className}`}
      title="Double-click to rename"
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
    >
      {value || <span className="text-slate-400">{placeholder}</span>}
    </span>
  )
}

export function useTimeUnit() {
  return useStore((s) => s.project.timeUnit)
}
