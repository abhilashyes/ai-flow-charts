import { create } from 'zustand'
import { useStore as useZustandStore } from 'zustand'
import { temporal, type TemporalState } from 'zundo'
import { nanoid } from 'nanoid'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import type {
  VsmProject,
  VsmStateMap,
  VsmNode,
  VsmEdge,
  VsmNodeType,
  VsmEdgeType,
  TimeUnit,
} from './types'
import { createNode } from './lib/nodeFactory'

interface Clipboard {
  nodes: VsmNode[]
  edges: VsmEdge[]
}

interface VsmStore {
  project: VsmProject
  selectedNodeId: string | null
  clipboard: Clipboard | null
  defaultEdgeType: VsmEdgeType

  // selectors
  activeState: () => VsmStateMap

  // project / state-map management
  setTimeUnit: (unit: TimeUnit) => void
  addState: (name?: string) => void
  duplicateStateAsFuture: () => void
  renameState: (id: string, name: string) => void
  removeState: (id: string) => void
  setActiveState: (id: string) => void
  loadProject: (project: VsmProject) => void

  // canvas interaction
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (conn: Connection) => void
  setDefaultEdgeType: (t: VsmEdgeType) => void

  addNodeAt: (type: VsmNodeType, position: { x: number; y: number }) => void
  updateNodeData: (id: string, data: Record<string, unknown>) => void
  setSelectedNode: (id: string | null) => void

  deleteSelection: () => void
  copySelection: () => void
  paste: () => void
  duplicateSelection: () => void
}

function emptyState(name: string): VsmStateMap {
  return { id: nanoid(8), name, nodes: [], edges: [] }
}

const initialState = emptyState('Current State')
const initialProject: VsmProject = {
  version: 1,
  timeUnit: 'days',
  states: [initialState],
  activeStateId: initialState.id,
}

// Update the active state map immutably.
function patchActive(project: VsmProject, fn: (s: VsmStateMap) => VsmStateMap): VsmProject {
  return {
    ...project,
    states: project.states.map((s) => (s.id === project.activeStateId ? fn(s) : s)),
  }
}

export const useStore = create<VsmStore>()(
  temporal(
    (set, get) => ({
      project: initialProject,
      selectedNodeId: null,
      clipboard: null,
      defaultEdgeType: 'push',

      activeState: () => {
        const p = get().project
        return p.states.find((s) => s.id === p.activeStateId) ?? p.states[0]
      },

      setTimeUnit: (unit) => set((st) => ({ project: { ...st.project, timeUnit: unit } })),

      addState: (name) =>
        set((st) => {
          const ns = emptyState(name ?? `State ${st.project.states.length + 1}`)
          return { project: { ...st.project, states: [...st.project.states, ns], activeStateId: ns.id } }
        }),

      duplicateStateAsFuture: () =>
        set((st) => {
          const src = st.project.states.find((s) => s.id === st.project.activeStateId)
          if (!src) return st
          // remap ids so the two maps are fully independent
          const idMap = new Map<string, string>()
          const nodes = src.nodes.map((n) => {
            const nid = nanoid(8)
            idMap.set(n.id, nid)
            return { ...n, id: nid, data: { ...n.data }, selected: false }
          })
          const edges = src.edges.map((e) => ({
            ...e,
            id: nanoid(8),
            source: idMap.get(e.source) ?? e.source,
            target: idMap.get(e.target) ?? e.target,
          }))
          const future: VsmStateMap = {
            id: nanoid(8),
            name: src.name.toLowerCase().includes('current') ? 'Future State' : `${src.name} (Future)`,
            nodes,
            edges,
          }
          return {
            project: { ...st.project, states: [...st.project.states, future], activeStateId: future.id },
          }
        }),

      renameState: (id, name) =>
        set((st) => ({
          project: {
            ...st.project,
            states: st.project.states.map((s) => (s.id === id ? { ...s, name } : s)),
          },
        })),

      removeState: (id) =>
        set((st) => {
          if (st.project.states.length <= 1) return st
          const states = st.project.states.filter((s) => s.id !== id)
          const activeStateId =
            st.project.activeStateId === id ? states[0].id : st.project.activeStateId
          return { project: { ...st.project, states, activeStateId } }
        }),

      setActiveState: (id) =>
        set((st) => ({ project: { ...st.project, activeStateId: id }, selectedNodeId: null })),

      loadProject: (project) => set({ project, selectedNodeId: null }),

      onNodesChange: (changes) =>
        set((st) => ({
          project: patchActive(st.project, (s) => ({
            ...s,
            nodes: applyNodeChanges(changes, s.nodes) as VsmNode[],
          })),
        })),

      onEdgesChange: (changes) =>
        set((st) => ({
          project: patchActive(st.project, (s) => ({
            ...s,
            edges: applyEdgeChanges(changes, s.edges) as VsmEdge[],
          })),
        })),

      onConnect: (conn) =>
        set((st) => ({
          project: patchActive(st.project, (s) => ({
            ...s,
            edges: addEdge({ ...conn, type: st.defaultEdgeType }, s.edges) as VsmEdge[],
          })),
        })),

      setDefaultEdgeType: (t) => set({ defaultEdgeType: t }),

      addNodeAt: (type, position) =>
        set((st) => {
          const node = createNode(type, position)
          return {
            project: patchActive(st.project, (s) => ({ ...s, nodes: [...s.nodes, node] })),
            selectedNodeId: node.id,
          }
        }),

      updateNodeData: (id, data) =>
        set((st) => ({
          project: patchActive(st.project, (s) => ({
            ...s,
            nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
          })),
        })),

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      deleteSelection: () =>
        set((st) => ({
          project: patchActive(st.project, (s) => {
            const selected = new Set(s.nodes.filter((n) => n.selected).map((n) => n.id))
            if (st.selectedNodeId) selected.add(st.selectedNodeId)
            const nodes = s.nodes.filter((n) => !selected.has(n.id))
            const edges = s.edges.filter(
              (e) =>
                !selected.has(e.source) &&
                !selected.has(e.target) &&
                !e.selected,
            )
            return { ...s, nodes, edges }
          }),
          selectedNodeId: null,
        })),

      copySelection: () =>
        set((st) => {
          const s = st.project.states.find((x) => x.id === st.project.activeStateId)!
          const sel = new Set(s.nodes.filter((n) => n.selected).map((n) => n.id))
          if (st.selectedNodeId) sel.add(st.selectedNodeId)
          const nodes = s.nodes.filter((n) => sel.has(n.id))
          const edges = s.edges.filter((e) => sel.has(e.source) && sel.has(e.target))
          if (nodes.length === 0) return st
          return { clipboard: { nodes, edges } }
        }),

      paste: () =>
        set((st) => {
          const cb = st.clipboard
          if (!cb || cb.nodes.length === 0) return st
          const idMap = new Map<string, string>()
          const nodes = cb.nodes.map((n) => {
            const nid = nanoid(8)
            idMap.set(n.id, nid)
            return {
              ...n,
              id: nid,
              position: { x: n.position.x + 32, y: n.position.y + 32 },
              data: { ...n.data },
              selected: true,
            }
          })
          const edges = cb.edges.map((e) => ({
            ...e,
            id: nanoid(8),
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
          }))
          return {
            project: patchActive(st.project, (s) => ({
              ...s,
              nodes: [...s.nodes.map((n) => ({ ...n, selected: false })), ...nodes],
              edges: [...s.edges, ...edges],
            })),
          }
        }),

      duplicateSelection: () => {
        get().copySelection()
        get().paste()
      },
    }),
    {
      // Only track the project for undo/redo; ignore selection / clipboard churn.
      partialize: (state) => ({ project: state.project }),
      limit: 100,
      equality: (a, b) => a.project === b.project,
    },
  ),
)

export const useTemporalStore = useStore.temporal

/** React hook to read the undo/redo (temporal) store reactively. */
export function useTemporal<T>(selector: (state: TemporalState<{ project: VsmProject }>) => T): T {
  return useZustandStore(useStore.temporal, selector)
}
