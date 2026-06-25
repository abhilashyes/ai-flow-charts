import { useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useStore, useTemporalStore } from './store'
import TopBar from './components/TopBar'
import Palette from './components/Palette'
import Canvas from './components/Canvas'
import Inspector from './components/Inspector'
import LeadTimeLadder from './components/LeadTimeLadder'
import CompareView from './components/CompareView'
import EmptyState from './components/EmptyState'

export default function App() {
  const [compare, setCompare] = useState(false)
  const active = useStore((s) => s.project.states.find((x) => x.id === s.project.activeStateId)!)
  const isEmpty = active.nodes.length === 0

  useKeyboardShortcuts()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar compare={compare} onToggleCompare={() => setCompare((c) => !c)} />
      {compare ? (
        <div className="min-h-0 flex-1">
          <CompareView />
        </div>
      ) : (
        <ReactFlowProvider>
          <div className="flex min-h-0 flex-1">
            <Palette />
            <main className="relative min-h-0 flex-1">
              <Canvas />
              {isEmpty && <EmptyState />}
            </main>
            <Inspector />
          </div>
          <LeadTimeLadder />
        </ReactFlowProvider>
      )}
    </div>
  )
}

function useKeyboardShortcuts() {
  const deleteSelection = useStore((s) => s.deleteSelection)
  const duplicateSelection = useStore((s) => s.duplicateSelection)
  const copySelection = useStore((s) => s.copySelection)
  const paste = useStore((s) => s.paste)

  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    }

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey

      if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        deleteSelection()
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        useTemporalStore.getState().undo()
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        useTemporalStore.getState().redo()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelection()
      } else if (mod && e.key.toLowerCase() === 'c') {
        copySelection()
      } else if (mod && e.key.toLowerCase() === 'v') {
        paste()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSelection, duplicateSelection, copySelection, paste])
}
