import { useEffect } from 'react'
import Header from './components/Header'
import MainLayout from './components/MainLayout'
import LeftPanel from './components/left/LeftPanel'
import RightPanel from './components/right/RightPanel'
import ToastStack from './components/Toast'
import { useValueChain } from './hooks/useValueChain'

export default function App() {
  const vc = useValueChain()

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
      <Header />
      <MainLayout left={<LeftPanel vc={vc} />} right={<RightPanel vc={vc} />} />
      <ToastStack toasts={vc.toasts} onDismiss={vc.dismissToast} />
    </div>
  )
}
