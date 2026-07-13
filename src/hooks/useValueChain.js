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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Central state for the value chain: processes, connectors, current mode,
 * selection, toasts, and an undo/redo history stack. Mutations go through
 * `commit`, which snapshots the previous chain for undo.
 */
export function useValueChain() {
  const [chain, setChain] = useState(makeInitial)
  const [currentMode, setCurrentMode] = useState(MODES.STANDARD)
  const [selected, setSelected] = useState(null) // { kind: 'process'|'connector', id }
  const [toasts, setToasts] = useState([])

  const past = useRef([])
  const future = useRef([])
  const [historyVersion, setHistoryVersion] = useState(0) // forces re-render of undo/redo enabled state

  const bumpHistory = () => setHistoryVersion((v) => v + 1)

  const toast = useCallback((message, kind = 'success') => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // Apply an updater to the chain, snapshotting the previous state for undo.
  const commit = useCallback((updater) => {
    setChain((prev) => {
      past.current = [...past.current, prev].slice(-HISTORY_LIMIT)
      future.current = []
      bumpHistory()
      const next = updater(prev)
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }, [])

  // The mode used for editing (standard/ideal); comparison falls back to standard.
  const editMode = currentMode === MODES.IDEAL ? MODES.IDEAL : MODES.STANDARD

  const addProcess = useCallback(
    (values) => {
      let created
      commit((prev) => {
        const refNum = generateRefNum('P', prev.processes)
        created = {
          id: nextId(prev.processes),
          refNum,
          name: values.name.trim(),
          type: values.type,
          stdTime: Number(values.stdTime),
          idealTime: Number(values.idealTime),
          stdRes: Number(values.stdRes),
          idealRes: Number(values.idealRes),
          mode: editMode,
        }
        return { ...prev, processes: [...prev.processes, created] }
      })
      // read the refNum from the just-created object after commit resolves
      setTimeout(() => created && toast(`${created.refNum} added!`), 0)
    },
    [commit, editMode, toast],
  )

  const deleteProcess = useCallback(
    (id) => {
      commit((prev) => {
        const proc = prev.processes.find((p) => p.id === id)
        const processes = prev.processes.filter((p) => p.id !== id)
        // cascade: drop connectors that reference the removed process
        const connectors = prev.connectors.filter((c) => c.source !== id && c.target !== id)
        setTimeout(() => toast(`${proc?.refNum ?? 'Process'} deleted`, 'info'), 0)
        return { ...prev, processes, connectors }
      })
      setSelected((s) => (s?.kind === 'process' && s.id === id ? null : s))
    },
    [commit, toast],
  )

  const addConnector = useCallback(
    (values) => {
      let created
      commit((prev) => {
        const refNum = generateRefNum('C', prev.connectors)
        created = {
          id: nextId(prev.connectors),
          refNum,
          source: Number(values.source),
          target: Number(values.target),
          type: values.type,
          modeOfConveyance: values.modeOfConveyance,
          stdTime: Number(values.stdTime),
          idealTime: Number(values.idealTime),
          stdRes: Number(values.stdRes),
          idealRes: Number(values.idealRes),
          mode: editMode,
        }
        return { ...prev, connectors: [...prev.connectors, created] }
      })
      setTimeout(() => created && toast(`${created.refNum} added!`), 0)
    },
    [commit, editMode, toast],
  )

  const deleteConnector = useCallback(
    (id) => {
      commit((prev) => {
        const conn = prev.connectors.find((c) => c.id === id)
        setTimeout(() => toast(`${conn?.refNum ?? 'Connector'} deleted`, 'info'), 0)
        return { ...prev, connectors: prev.connectors.filter((c) => c.id !== id) }
      })
      setSelected((s) => (s?.kind === 'connector' && s.id === id ? null : s))
    },
    [commit, toast],
  )

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    setChain((prev) => {
      const previous = past.current[past.current.length - 1]
      past.current = past.current.slice(0, -1)
      future.current = [prev, ...future.current].slice(0, HISTORY_LIMIT)
      bumpHistory()
      return previous
    })
    toast('Undo', 'info')
  }, [toast])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    setChain((prev) => {
      const nextState = future.current[0]
      future.current = future.current.slice(1)
      past.current = [...past.current, prev].slice(-HISTORY_LIMIT)
      bumpHistory()
      return nextState
    })
    toast('Redo', 'info')
  }, [toast])

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
    deleteConnector,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyVersion,
  }
}
