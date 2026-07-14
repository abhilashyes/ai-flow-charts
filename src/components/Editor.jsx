import { useEffect } from 'react'
import Header from './Header'
import MainLayout from './MainLayout'
import LeftPanel from './left/LeftPanel'
import RightPanel from './right/RightPanel'
import ToastStack from './Toast'
import { useValueChain } from '../hooks/useValueChain'

/**
 * The editing workspace for a single flow. Mount with `key={flow.id}` so opening
 * a different flow re-initialises the value-chain state cleanly.
 */
export default function Editor({ initialChain, onBack }) {
  const vc = useValueChain(initialChain)

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
      <Header onBack={onBack} name={vc.chain.name} onRename={vc.setName} />
      <MainLayout left={<LeftPanel vc={vc} />} right={<RightPanel vc={vc} />} />
      <ToastStack toasts={vc.toasts} onDismiss={vc.dismissToast} />
    </div>
  )
}
