import { useCallback, useEffect, useState } from 'react'
import { listFlows, saveFlow, deleteFlow, getFlow, ensureSeeded } from '../utils/store'
import { makeBlankFlow, cloneFlow } from '../utils/flow'

// Home-screen state: the list of saved flows plus create/rename/duplicate/delete
// actions. Backed by the async store (localStorage or the REST API).
export function useFlows() {
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => setFlows(await listFlows()), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureSeeded()
        const list = await listFlows()
        if (!cancelled) setFlows(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const createFlow = useCallback(async (name) => {
    const flow = makeBlankFlow(name?.trim() || 'Untitled Value Chain')
    await saveFlow(flow)
    setFlows(await listFlows())
    return flow.id
  }, [])

  const renameFlow = useCallback(async (id, name) => {
    const flow = await getFlow(id)
    if (!flow) return
    await saveFlow({ ...flow, name: name.trim() || flow.name, updatedAt: new Date().toISOString() })
    setFlows(await listFlows())
  }, [])

  const duplicateFlow = useCallback(async (id) => {
    const flow = await getFlow(id)
    if (!flow) return
    const copy = cloneFlow(flow)
    await saveFlow(copy)
    setFlows(await listFlows())
    return copy.id
  }, [])

  const removeFlow = useCallback(async (id) => {
    await deleteFlow(id)
    setFlows(await listFlows())
  }, [])

  return { flows, loading, refresh, createFlow, renameFlow, duplicateFlow, removeFlow }
}
