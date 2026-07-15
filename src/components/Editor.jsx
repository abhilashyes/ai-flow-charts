import { useEffect, useState } from 'react'
import Header from './Header'
import VersionBar from './VersionBar'
import MainLayout from './MainLayout'
import LeftPanel from './left/LeftPanel'
import RightPanel from './right/RightPanel'
import ComparisonView from './right/ComparisonView'
import ToastStack from './Toast'
import { useFlowEditor } from '../hooks/useFlowEditor'

/**
 * The editing workspace for a single flow. Mount with `key={flow.id}` so opening
 * a different flow re-initialises the editor state cleanly.
 */
export default function Editor({ initialFlow, onBack }) {
  const vc = useFlowEditor(initialFlow)
  const [comparing, setComparing] = useState(false)

  // Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redo.
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        vc.undo()
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        vc.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [vc])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onBack={onBack} name={vc.name} onRename={vc.setName} />
      <VersionBar vc={vc} comparing={comparing} onToggleCompare={() => setComparing((c) => !c)} />
      {comparing ? (
        <div className="min-h-0 flex-1 bg-slate-50">
          <ComparisonView flow={vc.flow} />
        </div>
      ) : (
        <MainLayout left={<LeftPanel vc={vc} />} right={<RightPanel vc={vc} />} />
      )}
      <ToastStack toasts={vc.toasts} onDismiss={vc.dismissToast} />
    </div>
  )
}
