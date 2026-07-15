import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_TIME_UNIT, VERSION_LABEL } from '../utils/constants'
import { nextId, renumber } from '../utils/refnum'
import { makeBlankFlow } from '../utils/flow'
import { saveFlow } from '../utils/store'

const HISTORY_LIMIT = 50
const now = () => new Date().toISOString()

/**
 * Editor state for one flow. A flow holds three independent version diagrams
 * (current/target/ideal); `activeVersion` selects the one being edited. Element
 * and timeline mutators operate only on the active version, so versions never
 * affect each other. `commit` snapshots the whole flow for undo/redo. The flow
 * is persisted to the store on every change.
 *
 * Mount the editor with `key={flow.id}` so switching flows re-initialises this
 * hook.
 */
export function useFlowEditor(initialFlow) {
  const [flow, setFlow] = useState(() => initialFlow ?? makeBlankFlow())
  const [activeVersion, setActiveVersion] = useState('current')
  const [selected, setSelected] = useState(null) // { kind: 'process'|'connector', id }
  const [editRequest, setEditRequest] = useState(null) // { kind, id, nonce } — open a tile's edit dialog
  const [toasts, setToasts] = useState([])

  // Persist to the flow store on every change (localStorage upsert by id).
  useEffect(() => {
    saveFlow(flow)
  }, [flow])

  const past = useRef([])
  const future = useRef([])
  const [, bump] = useState(0)
  const rerender = () => bump((v) => v + 1)

  const version = flow.versions[activeVersion]

  const toast = useCallback((message, kind = 'success') => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // Switch which version is being edited; selection is per-version so reset it.
  const changeVersion = useCallback((v) => {
    setActiveVersion(v)
    setSelected(null)
  }, [])

  // Ask the left panel to open a tile's edit dialog (from a diagram double-click).
  const requestEdit = useCallback((kind, id) => setEditRequest({ kind, id, nonce: Date.now() }), [])
  const clearEditRequest = useCallback(() => setEditRequest(null), [])

  // Rename the flow (lightweight, not part of undo history).
  const setName = useCallback((name) => {
    setFlow((prev) => ({ ...prev, name, updatedAt: now() }))
  }, [])

  // Update the active version's chain without touching history (timeline edits).
  const patchVersion = useCallback(
    (updater) => {
      setFlow((prev) => ({
        ...prev,
        versions: { ...prev.versions, [activeVersion]: updater(prev.versions[activeVersion]) },
        updatedAt: now(),
      }))
    },
    [activeVersion],
  )

  // Timeline columns of the active version (lightweight, not undo history).
  const setColumnLabel = useCallback(
    (id, label) =>
      patchVersion((v) => ({
        ...v,
        timeline: (v.timeline ?? []).map((c) => (c.id === id ? { ...c, label } : c)),
      })),
    [patchVersion],
  )

  const addColumn = useCallback(
    () =>
      patchVersion((v) => {
        const timeline = v.timeline ?? []
        return { ...v, timeline: [...timeline, { id: crypto.randomUUID(), label: `Day ${timeline.length + 1}` }] }
      }),
    [patchVersion],
  )

  const addColumnStart = useCallback(
    () =>
      patchVersion((v) => ({
        ...v,
        timeline: [{ id: crypto.randomUUID(), label: '' }, ...(v.timeline ?? [])],
      })),
    [patchVersion],
  )

  const removeColumn = useCallback(
    (id) => patchVersion((v) => ({ ...v, timeline: (v.timeline ?? []).filter((c) => c.id !== id) })),
    [patchVersion],
  )

  // Swim lanes of the active version (lightweight, not undo history).
  const setLaneLabel = useCallback(
    (id, label) =>
      patchVersion((v) => ({
        ...v,
        lanes: (v.lanes ?? []).map((l) => (l.id === id ? { ...l, label } : l)),
      })),
    [patchVersion],
  )

  const addLane = useCallback(
    () =>
      patchVersion((v) => {
        const lanes = v.lanes ?? []
        return { ...v, lanes: [...lanes, { id: crypto.randomUUID(), label: `Lane ${lanes.length + 1}`, rows: 1 }] }
      }),
    [patchVersion],
  )

  const addLaneStart = useCallback(
    () =>
      patchVersion((v) => ({
        ...v,
        lanes: [{ id: crypto.randomUUID(), label: '', rows: 1 }, ...(v.lanes ?? [])],
      })),
    [patchVersion],
  )

  const setLaneRows = useCallback(
    (id, rows) =>
      patchVersion((v) => ({
        ...v,
        lanes: (v.lanes ?? []).map((l) => (l.id === id ? { ...l, rows: Math.max(1, rows) } : l)),
      })),
    [patchVersion],
  )

  const removeLane = useCallback(
    (id) =>
      patchVersion((v) => ({
        ...v,
        lanes: (v.lanes ?? []).filter((l) => l.id !== id),
        // unassign any processes that were in the removed lane
        processes: (v.processes ?? []).map((p) => (p.laneId === id ? { ...p, laneId: null } : p)),
      })),
    [patchVersion],
  )

  // Snapshot the whole flow for undo, then set the active version's next chain.
  const commit = useCallback(
    (nextVersion) => {
      past.current = [...past.current, flow].slice(-HISTORY_LIMIT)
      future.current = []
      rerender()
      setFlow({
        ...flow,
        versions: { ...flow.versions, [activeVersion]: nextVersion },
        updatedAt: now(),
      })
    },
    [flow, activeVersion],
  )

  const addProcess = useCallback(
    (values) => {
      const created = {
        id: nextId(version.processes),
        refNum: 'P', // set by renumber below
        name: values.name.trim(),
        type: values.type,
        stdTime: Number(values.stdTime),
        stdTimeUnit: values.stdTimeUnit || DEFAULT_TIME_UNIT,
        idealTime: Number(values.idealTime),
        idealTimeUnit: values.idealTimeUnit || DEFAULT_TIME_UNIT,
        stdRes: Number(values.stdRes),
        idealRes: Number(values.idealRes),
        abnormal: Boolean(values.abnormal),
        laneId: values.laneId || null,
      }
      const processes = renumber([...version.processes, created], 'P')
      commit({ ...version, processes })
      toast(`${processes[processes.length - 1].refNum} added!`)
    },
    [version, commit, toast],
  )

  const editProcess = useCallback(
    (id, values) => {
      commit({
        ...version,
        processes: version.processes.map((p) =>
          p.id === id
            ? {
                ...p,
                name: values.name.trim(),
                type: values.type,
                stdTime: Number(values.stdTime),
                stdTimeUnit: values.stdTimeUnit || DEFAULT_TIME_UNIT,
                idealTime: Number(values.idealTime),
                idealTimeUnit: values.idealTimeUnit || DEFAULT_TIME_UNIT,
                stdRes: Number(values.stdRes),
                idealRes: Number(values.idealRes),
                abnormal: Boolean(values.abnormal),
                laneId: values.laneId || null,
              }
            : p,
        ),
      })
      toast(`${version.processes.find((p) => p.id === id)?.refNum ?? 'Process'} updated`)
    },
    [version, commit, toast],
  )

  const deleteProcess = useCallback(
    (id) => {
      const proc = version.processes.find((p) => p.id === id)
      const processes = renumber(version.processes.filter((p) => p.id !== id), 'P')
      // cascade: drop connectors that reference the removed process, then renumber
      const connectors = renumber(
        version.connectors.filter((c) => c.source !== id && c.target !== id),
        'C',
      )
      commit({ ...version, processes, connectors })
      toast(`${proc?.refNum ?? 'Process'} deleted`, 'info')
      setSelected((s) => (s?.kind === 'process' && s.id === id ? null : s))
    },
    [version, commit, toast],
  )

  const addConnector = useCallback(
    (values) => {
      const created = {
        id: nextId(version.connectors),
        refNum: 'C', // set by renumber below
        source: Number(values.source),
        target: Number(values.target),
        type: values.type,
        modeOfConveyance: values.modeOfConveyance,
        stdTime: Number(values.stdTime),
        stdTimeUnit: values.stdTimeUnit || DEFAULT_TIME_UNIT,
        idealTime: Number(values.idealTime),
        idealTimeUnit: values.idealTimeUnit || DEFAULT_TIME_UNIT,
        stdRes: Number(values.stdRes),
        idealRes: Number(values.idealRes),
        abnormal: Boolean(values.abnormal),
        srcSide: 'auto', // exit side of the source shape: auto|top|bottom|left|right
        tgtSide: 'auto', // entry side of the target shape: auto|top|bottom|left|right
      }
      const connectors = renumber([...version.connectors, created], 'C')
      commit({ ...version, connectors })
      toast(`${connectors[connectors.length - 1].refNum} added!`)
    },
    [version, commit, toast],
  )

  const updateConnector = useCallback(
    (id, patch) => {
      commit({
        ...version,
        connectors: version.connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })
    },
    [version, commit],
  )

  // Assign a process to a swim lane (used by drag-to-lane). History-tracked.
  const setProcessLane = useCallback(
    (processId, laneId) => {
      commit({
        ...version,
        processes: version.processes.map((p) =>
          p.id === processId ? { ...p, laneId: laneId || null } : p,
        ),
      })
    },
    [version, commit],
  )

  const editConnector = useCallback(
    (id, values) => {
      commit({
        ...version,
        connectors: version.connectors.map((c) =>
          c.id === id
            ? {
                ...c,
                source: Number(values.source),
                target: Number(values.target),
                type: values.type,
                modeOfConveyance: values.modeOfConveyance,
                stdTime: Number(values.stdTime),
                stdTimeUnit: values.stdTimeUnit || DEFAULT_TIME_UNIT,
                idealTime: Number(values.idealTime),
                idealTimeUnit: values.idealTimeUnit || DEFAULT_TIME_UNIT,
                stdRes: Number(values.stdRes),
                idealRes: Number(values.idealRes),
                abnormal: Boolean(values.abnormal),
              }
            : c,
        ),
      })
      toast(`${version.connectors.find((c) => c.id === id)?.refNum ?? 'Connector'} updated`)
    },
    [version, commit, toast],
  )

  const deleteConnector = useCallback(
    (id) => {
      const conn = version.connectors.find((c) => c.id === id)
      const connectors = renumber(version.connectors.filter((c) => c.id !== id), 'C')
      commit({ ...version, connectors })
      toast(`${conn?.refNum ?? 'Connector'} deleted`, 'info')
      setSelected((s) => (s?.kind === 'connector' && s.id === id ? null : s))
    },
    [version, commit, toast],
  )

  // Copy an entire version diagram over another (deep clone). History-tracked.
  const copyVersion = useCallback(
    (fromV, toV) => {
      if (fromV === toV) return
      past.current = [...past.current, flow].slice(-HISTORY_LIMIT)
      future.current = []
      rerender()
      setFlow({
        ...flow,
        versions: { ...flow.versions, [toV]: structuredClone(flow.versions[fromV]) },
        updatedAt: now(),
      })
      toast(`Copied ${VERSION_LABEL[fromV]} → ${VERSION_LABEL[toV]}`)
    },
    [flow, toast],
  )

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    const previous = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [flow, ...future.current].slice(0, HISTORY_LIMIT)
    rerender()
    setFlow(previous)
    toast('Undo', 'info')
  }, [flow, toast])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    const nextState = future.current[0]
    future.current = future.current.slice(1)
    past.current = [...past.current, flow].slice(-HISTORY_LIMIT)
    rerender()
    setFlow(nextState)
    toast('Redo', 'info')
  }, [flow, toast])

  return {
    flow,
    name: flow.name,
    activeVersion,
    setActiveVersion: changeVersion,
    copyVersion,
    // active version data
    processes: version.processes,
    connectors: version.connectors,
    timeline: version.timeline ?? [],
    lanes: version.lanes ?? [],
    selected,
    setSelected,
    editRequest,
    requestEdit,
    clearEditRequest,
    toasts,
    toast,
    dismissToast,
    addProcess,
    editProcess,
    deleteProcess,
    addConnector,
    editConnector,
    updateConnector,
    deleteConnector,
    setName,
    setColumnLabel,
    addColumn,
    addColumnStart,
    removeColumn,
    setLaneLabel,
    addLane,
    addLaneStart,
    setLaneRows,
    removeLane,
    setProcessLane,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}
