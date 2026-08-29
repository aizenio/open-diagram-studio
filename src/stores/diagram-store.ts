import {
  MarkerType,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import {
  createBlankDocument,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramNode,
  type DiagramNodeKind,
} from '../domain/diagram'

export interface DiagramNodeData extends Record<string, unknown> {
  kind: DiagramNodeKind
  label: string
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

export type FlowDiagramNode = Node<DiagramNodeData, 'diagramNode'>
type SaveState = 'loading' | 'saving' | 'saved' | 'error'
type PendingConnector = { nodeId: string; handleId: string }
type InteractionLog = { id: string; time: string; message: string }

interface DiagramState {
  title: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  pendingConnector: PendingConnector | null
  interactionLog: InteractionLog[]
  hydrated: boolean
  saveState: SaveState
  hydrate: (document: DiagramDocument | null) => void
  setSaveState: (saveState: SaveState) => void
  setTitle: (title: string) => void
  addNode: (kind: DiagramNodeKind) => void
  drawNode: (
    kind: DiagramNodeKind,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void
  onNodesChange: (changes: NodeChange<FlowDiagramNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  connect: (connection: Connection) => void
  clickConnector: (nodeId: string, handleId: string) => void
  cancelConnector: () => void
  logInteraction: (message: string) => void
  clearInteractionLog: () => void
  setSelection: (nodeIds: string[], edgeIds: string[]) => void
  moveSelected: (deltaX: number, deltaY: number) => void
  deleteSelected: () => void
  removeNode: (nodeId: string) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  resizeTextNode: (nodeId: string, width: number, height: number) => void
  updateSelectedNode: (
    patch: Partial<
      Pick<DiagramNode, 'label' | 'fillColor' | 'strokeColor' | 'strokeWidth'>
    >,
  ) => void
}

const initialDocument = createBlankDocument()
const appendInteraction = (
  entries: InteractionLog[],
  message: string,
): InteractionLog[] => {
  const entry = {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString(),
    message,
  }
  console.info(`[Diagram Studio] ${entry.time} ${message}`)
  return [...entries, entry].slice(-12)
}
const labels: Record<DiagramNodeKind, string> = {
  text: '',
  rectangle: 'Rectangle',
  roundedRectangle: 'Rounded rectangle',
  ellipse: 'Ellipse',
  diamond: 'Decision',
  client: 'Client',
  server: 'Server',
  database: 'Database',
  queue: 'Queue',
  cloud: 'Cloud',
}

const createNode = (
  kind: DiagramNodeKind,
  index: number,
  bounds?: { x: number; y: number; width: number; height: number },
): DiagramNode => ({
  id: crypto.randomUUID(),
  kind,
  x: bounds?.x ?? 120 + (index % 4) * 36,
  y: bounds?.y ?? 100 + (index % 5) * 34,
  width: bounds?.width ?? (kind === 'text' ? 200 : kind === 'diamond' ? 120 : 156),
  height: bounds?.height ?? (kind === 'text' ? 40 : kind === 'diamond' ? 120 : 84),
  label: labels[kind],
  fillColor: '#ffffff',
  strokeColor: '#31352f',
  strokeWidth: 2,
})

export const toFlowNode = (
  node: DiagramNode,
  selectedNodeIds: string[],
): FlowDiagramNode => ({
  id: node.id,
  type: 'diagramNode',
  position: { x: node.x, y: node.y },
  style: { width: node.width, height: node.height },
  measured: { width: node.width, height: node.height },
  selected: selectedNodeIds.includes(node.id),
  data: {
    kind: node.kind,
    label: node.label,
    fillColor: node.fillColor,
    strokeColor: node.strokeColor,
    strokeWidth: node.strokeWidth,
  },
})

export const toFlowEdge = (
  edge: DiagramEdge,
  selectedEdgeIds: string[],
): Edge => ({
  ...edge,
  sourceHandle: edge.sourceHandle?.replace(/^(source|target)-/, '') ?? 'right',
  targetHandle: edge.targetHandle?.replace(/^(source|target)-/, '') ?? 'left',
  selected: selectedEdgeIds.includes(edge.id),
  interactionWidth: 24,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#31352f' },
  style: {
    stroke: selectedEdgeIds.includes(edge.id) ? '#2f6f52' : '#31352f',
    strokeWidth: selectedEdgeIds.includes(edge.id) ? 3 : 2,
  },
})

export const useDiagramStore = create<DiagramState>((set, get) => ({
  title: initialDocument.title,
  nodes: initialDocument.nodes,
  edges: initialDocument.edges,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  pendingConnector: null,
  interactionLog: [],
  hydrated: false,
  saveState: 'loading',

  hydrate: (document) => {
    const nextDocument = document ?? createBlankDocument()
    const nodes = nextDocument.nodes.filter(
      (node) => node.kind !== 'text' || node.label.trim(),
    )
    const nodeIds = new Set(nodes.map((node) => node.id))
    set({
      title: nextDocument.title,
      nodes,
      edges: nextDocument.edges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
      ),
      hydrated: true,
      saveState: 'saved',
    })
  },
  setSaveState: (saveState) => set({ saveState }),
  setTitle: (title) => set({ title }),
  addNode: (kind) =>
    set((state) => {
      const node = createNode(kind, state.nodes.length)
      return {
        nodes: [...state.nodes, node],
        selectedNodeIds: [node.id],
        selectedEdgeIds: [],
      }
    }),
  drawNode: (kind, x, y, width, height) =>
    set((state) => {
      const node = createNode(kind, state.nodes.length, {
        x,
        y,
        width,
        height,
      })
      return {
        nodes: [...state.nodes, node],
        selectedNodeIds: [node.id],
        selectedEdgeIds: [],
      }
    }),
  onNodesChange: (changes) =>
    set((state) => {
      const meaningfulChanges = changes.filter(
        (change) => change.type !== 'dimensions' || change.setAttributes,
      )
      if (meaningfulChanges.length === 0) return state
      const flowNodes = state.nodes.map((node) =>
        toFlowNode(node, state.selectedNodeIds),
      )
      const nextFlowNodes = applyNodeChanges(meaningfulChanges, flowNodes)
      const nodeById = new Map(state.nodes.map((node) => [node.id, node]))
      const dimensionsById = new Map<string, { width: number; height: number }>()
      meaningfulChanges.forEach((change) => {
        if (change.type === 'dimensions' && change.dimensions) {
          dimensionsById.set(change.id, change.dimensions)
        }
      })
      let nodes = nextFlowNodes.map((flowNode) => {
        const previous = nodeById.get(flowNode.id)!
        const dimensions = dimensionsById.get(flowNode.id)
        return {
          ...previous,
          x: flowNode.position.x,
          y: flowNode.position.y,
          width: dimensions?.width ?? flowNode.width ?? previous.width,
          height: dimensions?.height ?? flowNode.height ?? previous.height,
        }
      })
      const movedSelectedNodes = meaningfulChanges.filter(
        (change) =>
          change.type === 'position' &&
          state.selectedNodeIds.includes(change.id),
      )
      if (state.selectedNodeIds.length > 1 && movedSelectedNodes.length === 1) {
        const movedChange = movedSelectedNodes[0]
        if (movedChange.type !== 'position') return { nodes }
        const movedId = movedChange.id
        const previous = nodeById.get(movedId)
        const moved = nodes.find((node) => node.id === movedId)
        if (previous && moved) {
          const deltaX = moved.x - previous.x
          const deltaY = moved.y - previous.y
          nodes = nodes.map((node) =>
            node.id !== movedId && state.selectedNodeIds.includes(node.id)
              ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
              : node,
          )
        }
      }
      const remainingIds = new Set(nodes.map((node) => node.id))
      return {
        nodes,
        edges: state.edges.filter(
          (edge) =>
            remainingIds.has(edge.source) && remainingIds.has(edge.target),
        ),
        selectedNodeIds: nextFlowNodes
          .filter((node) => node.selected)
          .map((node) => node.id),
      }
    }),
  onEdgesChange: (changes) =>
    set((state) => {
      const flowEdges = state.edges.map((edge) =>
        toFlowEdge(edge, state.selectedEdgeIds),
      )
      const nextEdges = applyEdgeChanges(changes, flowEdges)
      return {
        edges: nextEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
        selectedEdgeIds: nextEdges
          .filter((edge) => edge.selected)
          .map((edge) => edge.id),
      }
    }),
  connect: (connection) => {
    if (!connection.source || !connection.target) {
      set((state) => ({
        interactionLog: appendInteraction(
          state.interactionLog,
          'Arrow rejected: source or target connector is missing',
        ),
      }))
      return
    }
    set((state) => {
      const id = crypto.randomUUID()
      const sourceLabel =
        state.nodes.find((node) => node.id === connection.source)?.label ??
        connection.source
      const targetLabel =
        state.nodes.find((node) => node.id === connection.target)?.label ??
        connection.target
      return {
        edges: [
          ...state.edges,
          {
            id,
            source: connection.source!,
            target: connection.target!,
            sourceHandle:
              connection.sourceHandle?.replace(/^(source|target)-/, '') ??
              'right',
            targetHandle:
              connection.targetHandle?.replace(/^(source|target)-/, '') ??
              'left',
          },
        ],
        selectedNodeIds: [],
        selectedEdgeIds: [id],
        pendingConnector: null,
        interactionLog: appendInteraction(
          state.interactionLog,
          `Arrow created by drag: ${sourceLabel} -> ${targetLabel}`,
        ),
      }
    })
  },
  clickConnector: (nodeId, handleId) =>
    set((state) => {
      const pending = state.pendingConnector
      const nodeLabel =
        state.nodes.find((node) => node.id === nodeId)?.label ?? nodeId
      if (!pending) {
        return {
          pendingConnector: { nodeId, handleId },
          interactionLog: appendInteraction(
            state.interactionLog,
            `First connector: ${nodeLabel}.${handleId}; click a second connector`,
          ),
        }
      }
      if (pending.nodeId === nodeId && pending.handleId === handleId) {
        return {
          pendingConnector: null,
          interactionLog: appendInteraction(
            state.interactionLog,
            `Arrow cancelled at ${nodeLabel}.${handleId}`,
          ),
        }
      }
      const id = crypto.randomUUID()
      const sourceLabel =
        state.nodes.find((node) => node.id === pending.nodeId)?.label ??
        pending.nodeId
      return {
        edges: [
          ...state.edges,
          {
            id,
            source: pending.nodeId,
            target: nodeId,
            sourceHandle: pending.handleId,
            targetHandle: handleId,
          },
        ],
        selectedNodeIds: [],
        selectedEdgeIds: [id],
        pendingConnector: null,
        interactionLog: appendInteraction(
          state.interactionLog,
          `Arrow created: ${sourceLabel}.${pending.handleId} -> ${nodeLabel}.${handleId}`,
        ),
      }
    }),
  cancelConnector: () =>
    set((state) =>
      state.pendingConnector
        ? {
            pendingConnector: null,
            interactionLog: appendInteraction(
              state.interactionLog,
              'Pending arrow cancelled',
            ),
          }
        : state,
    ),
  logInteraction: (message) =>
    set((state) => ({
      interactionLog: appendInteraction(state.interactionLog, message),
    })),
  clearInteractionLog: () => set({ interactionLog: [] }),
  setSelection: (selectedNodeIds, selectedEdgeIds) =>
    set((state) => {
      const nodesUnchanged =
        state.selectedNodeIds.length === selectedNodeIds.length &&
        state.selectedNodeIds.every((id, index) => id === selectedNodeIds[index])
      const edgesUnchanged =
        state.selectedEdgeIds.length === selectedEdgeIds.length &&
        state.selectedEdgeIds.every((id, index) => id === selectedEdgeIds[index])
      return nodesUnchanged && edgesUnchanged
        ? state
        : { selectedNodeIds, selectedEdgeIds }
    }),
  moveSelected: (deltaX, deltaY) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        state.selectedNodeIds.includes(node.id)
          ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
          : node,
      ),
    })),
  deleteSelected: () => {
    const { selectedNodeIds, selectedEdgeIds } = get()
    const removedNodes = new Set(selectedNodeIds)
    set((state) => ({
      nodes: state.nodes.filter((node) => !removedNodes.has(node.id)),
      edges: state.edges.filter(
        (edge) =>
          !selectedEdgeIds.includes(edge.id) &&
          !removedNodes.has(edge.source) &&
          !removedNodes.has(edge.target),
      ),
      selectedNodeIds: [],
      selectedEdgeIds: [],
      pendingConnector: null,
      interactionLog: appendInteraction(
        state.interactionLog,
        `Deleted ${selectedNodeIds.length} node(s) and ${selectedEdgeIds.length} arrow(s)`,
      ),
    }))
  },
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
      pendingConnector:
        state.pendingConnector?.nodeId === nodeId
          ? null
          : state.pendingConnector,
      interactionLog: appendInteraction(
        state.interactionLog,
        'Empty text box discarded',
      ),
    })),
  updateNodeLabel: (nodeId, label) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, label } : node,
      ),
    })),
  resizeTextNode: (nodeId, width, height) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, width, height } : node,
      ),
    })),
  updateSelectedNode: (patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        state.selectedNodeIds.includes(node.id) ? { ...node, ...patch } : node,
      ),
    })),
}))
