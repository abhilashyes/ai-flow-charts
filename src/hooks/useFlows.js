import { useCallback, useState } from 'react'
import { listFlows, saveFlow, deleteFlow, getFlow, ensureSeeded } from '../utils/store'
import { makeBlankFlow, cloneFlow } from '../utils/flow'

// Home-screen state: the list of saved flows plus create/rename/duplicate/delete
// actions. Reads from and writes to the localStorage-backed flow store.
export function useFlows() {
  const [flows, setFlows] = useState(() => {
    ensureSeeded()
    return listFlows()
  })

  const refresh = useCallback(() => setFlows(listFlows()), [])

  const createFlow = useCallback(
    (name) => {
      const flow = makeBlankFlow(name?.trim() || 'Untitled Value Chain')
      saveFlow(flow)
      setFlows(listFlows())
      return flow.id
    },
    [],
  )

  const renameFlow = useCallback((id, name) => {
    const chain = getFlow(id)
    if (!chain) return
    saveFlow({ ...chain, name: name.trim() || chain.name, updatedAt: new Date().toISOString() })
    setFlows(listFlows())
  }, [])

  const duplicateFlow = useCallback((id) => {
    const flow = getFlow(id)
    if (!flow) return
    const copy = cloneFlow(flow)
    saveFlow(copy)
    setFlows(listFlows())
    return copy.id
  }, [])

  const removeFlow = useCallback((id) => {
    deleteFlow(id)
    setFlows(listFlows())
  }, [])

  return { flows, refresh, createFlow, renameFlow, duplicateFlow, removeFlow }
}
