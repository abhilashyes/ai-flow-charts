import { useCallback, useRef, useState } from 'react'
import { MODES } from '../utils/constants'
import { generateRefNum, nextId } from '../utils/refnum'
import { initialProcesses, initialConnectors } from '../utils/sampleData'

const HISTORY_LIMIT = 50

function makeInitial() {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Value Chain',
    processes: initialProcesses,
    connectors: initialConnectors,
    // Editable timeline columns shown across the top of the diagram.
    timeline: [
      { id: crypto.randomUUID(), label: 'Day 1' },
      { id: crypto.randomUUID(), label: 'Day 2' },
      { id: crypto.randomUUID(), label: 'Day 3' },
      { id: crypto.randomUUID(), label: 'Day 4' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Central state for the value chain: processes, connectors, current mode,
 * selection, toasts, and an undo/redo history stack. Mutators compute the next
 * chain from the current one and pass it to `commit`, which snapshots the
 * previous chain for undo. Effects (toasts, history) are kept out of the state
 * updater so nothing double-fires under React StrictMode.
 */
export function useValueChain() {
  const [chain, setChain] = useState(makeInitial)
  const [currentMode, setCurrentMode] = useState(MODES.STANDARD)
  const [selected, setSelected] = useState(null) // { kind: 'process'|'connector', id }
  const [toasts, setToasts] = useState([])

  const past = useRef([])
  const future = useRef([])
  const [, bump] = useState(0)
  const rerender = () => bump((v) => v + 1)

  const toast = useCallback((message, kind = 'success') => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // Timeline columns (lightweight edits, not part of undo history).
  const setColumnLabel = useCallback((id, label) => {
    setChain((prev) => ({
      ...prev,
      timeline: (prev.timeline ?? []).map((c) => (c.id === id ? { ...c, label } : c)),
    }))
  }, [])

  const addColumn = useCallback(() => {
    setChain((prev) => {
      const timeline = prev.timeline ?? []
      return {
        ...prev,
        timeline: [...timeline, { id: crypto.randomUUID(), label: `Day ${timeline.length + 1}` }],
      }
    })
  }, [])

  const removeColumn = useCallback((id) => {
    setChain((prev) => ({ ...prev, timeline: (prev.timeline ?? []).filter((c) => c.id !== id) }))
  }, [])

  // The mode used for editing (standard/ideal); comparison falls back to standard.
  const editMode = currentMode === MODES.IDEAL ? MODES.IDEAL : MODES.STANDARD

  // Snapshot the current chain for undo, then set the new one.
  const commit = useCallback(
    (nextChain) => {
      past.current = [...past.current, chain].slice(-HISTORY_LIMIT)
      future.current = []
      rerender()
      setChain({ ...nextChain, updatedAt: new Date().toISOString() })
    },
    [chain],
  )

  const addProcess = useCallback(
    (values) => {
      const created = {
        id: nextId(chain.processes),
        refNum: generateRefNum('P', chain.processes),
        name: values.name.trim(),
        type: values.type,
        stdTime: Number(values.stdTime),
        idealTime: Number(values.idealTime),
        stdRes: Number(values.stdRes),
        idealRes: Number(values.idealRes),
        mode: editMode,
      }
      commit({ ...chain, processes: [...chain.processes, created] })
      toast(`${created.refNum} added!`)
    },
    [chain, editMode, commit, toast],
  )

  const deleteProcess = useCallback(
    (id) => {
      const proc = chain.processes.find((p) => p.id === id)
      commit({
        ...chain,
        processes: chain.processes.filter((p) => p.id !== id),
        // cascade: drop connectors that reference the removed process
        connectors: chain.connectors.filter((c) => c.source !== id && c.target !== id),
      })
      toast(`${proc?.refNum ?? 'Process'} deleted`, 'info')
      setSelected((s) => (s?.kind === 'process' && s.id === id ? null : s))
    },
    [chain, commit, toast],
  )

  const addConnector = useCallback(
    (values) => {
      const created = {
        id: nextId(chain.connectors),
        refNum: generateRefNum('C', chain.connectors),
        source: Number(values.source),
        target: Number(values.target),
        type: values.type,
        modeOfConveyance: values.modeOfConveyance,
        stdTime: Number(values.stdTime),
        idealTime: Number(values.idealTime),
        stdRes: Number(values.stdRes),
        idealRes: Number(values.idealRes),
        srcSide: 'auto', // exit side of the source shape: auto|top|bottom|left|right
        tgtSide: 'auto', // entry side of the target shape: auto|top|bottom|left|right
        mode: editMode,
      }
      commit({ ...chain, connectors: [...chain.connectors, created] })
      toast(`${created.refNum} added!`)
    },
    [chain, editMode, commit, toast],
  )

  const updateConnector = useCallback(
    (id, patch) => {
      commit({
        ...chain,
        connectors: chain.connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })
    },
    [chain, commit],
  )

  const deleteConnector = useCallback(
    (id) => {
      const conn = chain.connectors.find((c) => c.id === id)
      commit({ ...chain, connectors: chain.connectors.filter((c) => c.id !== id) })
      toast(`${conn?.refNum ?? 'Connector'} deleted`, 'info')
      setSelected((s) => (s?.kind === 'connector' && s.id === id ? null : s))
    },
    [chain, commit, toast],
  )

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    const previous = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [chain, ...future.current].slice(0, HISTORY_LIMIT)
    rerender()
    setChain(previous)
    toast('Undo', 'info')
  }, [chain, toast])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    const nextState = future.current[0]
    future.current = future.current.slice(1)
    past.current = [...past.current, chain].slice(-HISTORY_LIMIT)
    rerender()
    setChain(nextState)
    toast('Redo', 'info')
  }, [chain, toast])

  return {
    chain,
    currentMode,
    setCurrentMode,
    editMode,
    selected,
    setSelected,
    toasts,
    toast,
    dismissToast,
    addProcess,
    deleteProcess,
    addConnector,
    updateConnector,
    deleteConnector,
    timeline: chain.timeline ?? [],
    setColumnLabel,
    addColumn,
    removeColumn,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}
