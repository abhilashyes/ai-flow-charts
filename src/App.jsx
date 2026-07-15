import { useState } from 'react'
import HomeScreen from './components/home/HomeScreen'
import Editor from './components/Editor'
import { getFlow } from './utils/store'

/**
 * Top-level router: the Home screen (a gallery of saved flows) and the Editor
 * (the workspace for one flow). No URL routing library — a small view state is
 * enough for two screens.
 */
export default function App() {
  const [openId, setOpenId] = useState(null)

  if (openId) {
    const flow = getFlow(openId)
    // Guard against a stale/deleted id: fall back to Home.
    if (!flow) {
      setOpenId(null)
      return null
    }
    return <Editor key={openId} initialFlow={flow} onBack={() => setOpenId(null)} />
  }

  return <HomeScreen onOpen={setOpenId} />
}
