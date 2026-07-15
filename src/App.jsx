import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import HomeScreen from './components/home/HomeScreen'
import Editor from './components/Editor'
import LoginPage from './components/LoginPage'
import { useAuth } from './auth/useAuth'
import { getFlow } from './utils/store'

/**
 * Top-level router: auth gate (API mode only) → Home screen (gallery of flows)
 * or the Editor (workspace for one flow). Flow loading is async (localStorage or
 * REST API).
 */
export default function App() {
  const auth = useAuth()
  const [openId, setOpenId] = useState(null)
  const [flow, setFlow] = useState(undefined) // undefined = loading, null = missing

  useEffect(() => {
    if (!openId) {
      setFlow(undefined)
      return
    }
    setFlow(undefined)
    let cancelled = false
    getFlow(openId).then((f) => {
      if (cancelled) return
      if (!f) setOpenId(null) // stale/deleted id → back to Home
      else setFlow(f)
    })
    return () => {
      cancelled = true
    }
  }, [openId])

  // Auth gate (only when a backend is configured).
  if (auth.authRequired && !auth.ready) return <FullScreenSpinner />
  if (auth.authRequired && !auth.user) return <LoginPage onSignIn={auth.login} />

  if (openId) {
    if (flow === undefined) return <FullScreenSpinner />
    return <Editor key={openId} initialFlow={flow} onBack={() => setOpenId(null)} />
  }

  return (
    <HomeScreen
      onOpen={setOpenId}
      user={auth.user}
      onSignOut={auth.authRequired ? auth.logout : undefined}
    />
  )
}

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">
      <Loader2 size={24} className="animate-spin" />
    </div>
  )
}
