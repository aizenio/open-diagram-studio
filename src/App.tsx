import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  SelectionMode,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  AlignCenterHorizontal,
  Box,
  ArrowUpRight,
  Circle,
  Cloud,
  Diamond,
  Download,
  MousePointer2,
  PanelRight,
  RectangleHorizontal,
  Scan,
  Trash2,
  Type,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import './App.css'
import { diagramRepository } from './data/diagram-repository'
import type { DiagramDocument, DiagramNodeKind } from './domain/diagram'
import { DiagramEdges } from './features/diagram/DiagramEdges'
import { DiagramNode } from './features/diagram/DiagramNode'
import {
  type FlowDiagramNode,
  toFlowNode,
  useDiagramStore,
} from './stores/diagram-store'

const reportFlowError = (code: string, message: string) => {
  console.error(`React Flow ${code}: ${message}`)
}
type Tool = { kind: DiagramNodeKind; label: string; icon: LucideIcon }
type DrawDraft = {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

const nodeTypes = { diagramNode: DiagramNode }
const MIN_ZOOM = 0.05
const MAX_ZOOM = 8
const ZOOM_STEP = 1.2

const shapeTools: Tool[] = [
  { kind: 'text', label: 'Text', icon: Type },
  { kind: 'rectangle', label: 'Rectangle', icon: RectangleHorizontal },
  { kind: 'roundedRectangle', label: 'Rounded', icon: Box },
  { kind: 'ellipse', label: 'Ellipse', icon: Circle },
  { kind: 'diamond', label: 'Decision', icon: Diamond },
]

function makeDocument(
  title: string,
  nodes: DiagramDocument['nodes'],
  edges: DiagramDocument['edges'],
): DiagramDocument {
  return {
    id: 'current-diagram',
    title,
    version: 1,
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  }
}

function App() {
  const title = useDiagramStore((state) => state.title)
  const nodes = useDiagramStore((state) => state.nodes)
  const edges = useDiagramStore((state) => state.edges)
  const selectedNodeIds = useDiagramStore((state) => state.selectedNodeIds)
  const selectedEdgeIds = useDiagramStore((state) => state.selectedEdgeIds)
  const interactionLog = useDiagramStore((state) => state.interactionLog)
  const hydrated = useDiagramStore((state) => state.hydrated)
  const saveState = useDiagramStore((state) => state.saveState)
  const hydrate = useDiagramStore((state) => state.hydrate)
  const setSaveState = useDiagramStore((state) => state.setSaveState)
  const setTitle = useDiagramStore((state) => state.setTitle)
  const addNode = useDiagramStore((state) => state.addNode)
  const drawNode = useDiagramStore((state) => state.drawNode)
  const onNodesChange = useDiagramStore((state) => state.onNodesChange)
  const onEdgesChange = useDiagramStore((state) => state.onEdgesChange)
  const connect = useDiagramStore((state) => state.connect)
  const cancelConnector = useDiagramStore((state) => state.cancelConnector)
  const logInteraction = useDiagramStore((state) => state.logInteraction)
  const clearInteractionLog = useDiagramStore(
    (state) => state.clearInteractionLog,
  )
  const setSelection = useDiagramStore((state) => state.setSelection)
  const moveSelected = useDiagramStore((state) => state.moveSelected)
  const deleteSelected = useDiagramStore((state) => state.deleteSelected)
  const updateSelectedNode = useDiagramStore(
    (state) => state.updateSelectedNode,
  )
  const flowInstance = useRef<ReactFlowInstance<FlowDiagramNode> | null>(null)
  const [activeShape, setActiveShape] = useState<DiagramNodeKind | null>(null)
  const [arrowActive, setArrowActive] = useState(false)
  const [drawDraft, setDrawDraft] = useState<DrawDraft | null>(null)
  const [zoom, setZoom] = useState(1)
  const [inspectorOpen, setInspectorOpen] = useState(true)

  const changeZoom = useCallback((factor: number) => {
    const instance = flowInstance.current
    if (!instance) return
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, instance.getZoom() * factor),
    )
    void instance.zoomTo(nextZoom)
  }, [])

  const flowNodes = useMemo(
    () => nodes.map((node) => toFlowNode(node, selectedNodeIds)),
    [nodes, selectedNodeIds],
  )
  const selectedNode = nodes.find((node) => selectedNodeIds.includes(node.id))
  const selectedEdge = edges.find((edge) => selectedEdgeIds.includes(edge.id))
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: FlowDiagramNode) => {
      const nextNodeIds = event.shiftKey
        ? Array.from(new Set([...selectedNodeIds, node.id]))
        : [node.id]
      setSelection(nextNodeIds, [])
    },
    [selectedNodeIds, setSelection],
  )
  const onConnect = useCallback(
    (connection: Parameters<typeof connect>[0]) => {
      connect(connection)
      setArrowActive(false)
    },
    [connect],
  )

  useEffect(() => {
    diagramRepository
      .load()
      .then(hydrate)
      .catch(() => hydrate(null))
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      diagramRepository
        .save(makeDocument(title, nodes, edges))
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    }, 750)
    return () => window.clearTimeout(timeout)
  }, [edges, hydrated, nodes, setSaveState, title])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches('input, textarea, [contenteditable="true"]')) return
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault()
          changeZoom(ZOOM_STEP)
          return
        }
        if (event.key === '-') {
          event.preventDefault()
          changeZoom(1 / ZOOM_STEP)
          return
        }
        if (event.key === '0') {
          event.preventDefault()
          void flowInstance.current?.zoomTo(1, { duration: 180 })
          return
        }
      }
      if (event.key === 'Escape') {
        setActiveShape(null)
        setArrowActive(false)
        setDrawDraft(null)
        cancelConnector()
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        deleteSelected()
      }
      const movement: Record<string, [number, number]> = {
        ArrowLeft: [-10, 0],
        ArrowRight: [10, 0],
        ArrowUp: [0, -10],
        ArrowDown: [0, 10],
      }
      const delta = movement[event.key]
      if (delta && selectedNodeIds.length > 0) {
        event.preventDefault()
        event.stopPropagation()
        moveSelected(delta[0], delta[1])
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [cancelConnector, changeZoom, deleteSelected, moveSelected, selectedNodeIds.length])

  const exportJson = () => {
    const file = {
      format: 'diagram-studio',
      formatVersion: 1,
      document: makeDocument(title, nodes, edges),
    }
    const blob = new Blob([JSON.stringify(file, null, 2)], {
      type: 'application/json',
    })
    const link = window.document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${title.trim() || 'diagram'}.diagram.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportPng = async () => {
    const viewport = window.document.querySelector<HTMLElement>(
      '.react-flow__viewport',
    )
    if (!viewport) return
    const dataUrl = await toPng(viewport, { backgroundColor: '#f8f7f3' })
    const link = window.document.createElement('a')
    link.href = dataUrl
    link.download = `${title.trim() || 'diagram'}.png`
    link.click()
  }

  const beginDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeShape) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    setDrawDraft({ startX: x, startY: y, currentX: x, currentY: y })
  }

  const continueDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawDraft) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setDrawDraft((draft) =>
      draft
        ? {
            ...draft,
            currentX: event.clientX - bounds.left,
            currentY: event.clientY - bounds.top,
          }
        : null,
    )
  }

  const finishDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeShape || !drawDraft || !flowInstance.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const endX = event.clientX - bounds.left
    const endY = event.clientY - bounds.top
    const start = flowInstance.current.screenToFlowPosition({
      x: bounds.left + drawDraft.startX,
      y: bounds.top + drawDraft.startY,
    })
    const end = flowInstance.current.screenToFlowPosition({
      x: bounds.left + endX,
      y: bounds.top + endY,
    })
    const draggedWidth = Math.abs(end.x - start.x)
    const draggedHeight = Math.abs(end.y - start.y)
    const wasClick = draggedWidth < 12 && draggedHeight < 12
    const defaultWidth =
      activeShape === 'text' ? 200 : activeShape === 'diamond' ? 120 : 156
    const defaultHeight =
      activeShape === 'text' ? 40 : activeShape === 'diamond' ? 120 : 84

    drawNode(
      activeShape,
      wasClick ? start.x - defaultWidth / 2 : Math.min(start.x, end.x),
      wasClick ? start.y - defaultHeight / 2 : Math.min(start.y, end.y),
      wasClick ? defaultWidth : Math.max(44, draggedWidth),
      wasClick ? defaultHeight : Math.max(44, draggedHeight),
    )
    setDrawDraft(null)
    setActiveShape(null)
  }

  const createTextAtCursor = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (!target.classList.contains('react-flow__pane') || !flowInstance.current) {
      return
    }
    event.preventDefault()
    const position = flowInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    drawNode('text', position.x, position.y, 200, 40)
    logInteraction('Text box created from canvas double-click')
  }

  const renderTools = (tools: Tool[], drawable = false) =>
    tools.map(({ kind, label, icon: Icon }) => (
      <button
        key={kind}
        type="button"
        className={activeShape === kind ? 'active' : undefined}
        aria-pressed={drawable ? activeShape === kind : undefined}
        onClick={() =>
          drawable
            ? (setArrowActive(false),
              setActiveShape((current) => (current === kind ? null : kind)))
            : addNode(kind)
        }
        title={drawable ? `Draw ${label}` : `Add ${label}`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    ))

  return (
    <main className={`studio-shell${inspectorOpen ? '' : ' inspector-closed'}`}>
      <header className="topbar">
        <strong className="brand-copy">Diagram Studio</strong>
        <div className="workspace-name">
          <input
            className="diagram-title"
            aria-label="Diagram title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Cloud size={13} aria-label="Saved to local workspace" />
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={exportJson} title="Export diagram data">
            <Download size={14} /> JSON
          </button>
          <button className="export-button" type="button" onClick={() => void exportPng()}>
            <Download size={14} /> PNG
          </button>
          {!inspectorOpen ? (
            <button
              className="topbar-icon"
              type="button"
              onClick={() => setInspectorOpen(true)}
              title="Show properties"
            >
              <PanelRight size={16} />
            </button>
          ) : null}
        </div>
      </header>

      <aside className="tool-panel" aria-label="Diagram tools">
        <div className="tool-grid">
            <button
              type="button"
              className={!activeShape && !arrowActive ? 'active' : undefined}
              aria-pressed={!activeShape && !arrowActive}
              onClick={() => {
                setActiveShape(null)
                setArrowActive(false)
                setDrawDraft(null)
                cancelConnector()
              }}
              title="Select"
            >
              <MousePointer2 size={18} />
              <span>Select</span>
            </button>
            {renderTools(shapeTools, true)}
            <button
              type="button"
              className={arrowActive ? 'active' : undefined}
              aria-pressed={arrowActive}
              onClick={() => {
                setActiveShape(null)
                setDrawDraft(null)
                setArrowActive((active) => !active)
              }}
              title="Draw arrow"
            >
              <ArrowUpRight size={20} />
              <span>Arrow</span>
            </button>
        </div>
      </aside>

      <section
        className={`canvas-wrap${arrowActive ? ' connecting' : ''}`}
        aria-label="Diagram canvas"
        onDoubleClick={createTextAtCursor}
      >
        {!hydrated ? (
          <div className="loading-state">Loading local diagram...</div>
        ) : null}
        <ReactFlow
          nodes={flowNodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            flowInstance.current = instance
            setZoom(instance.getZoom())
          }}
          onMove={(_, viewport) => setZoom(viewport.zoom)}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onError={reportFlowError}
          fitView
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          fitViewOptions={{ maxZoom: 1 }}
          deleteKeyCode={null}
          connectionMode={ConnectionMode.Loose}
          connectOnClick={false}
          nodesConnectable
          edgesFocusable
          edgesReconnectable={false}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift"
          panOnDrag={[1, 2]}
          panOnScroll={false}
          zoomOnScroll
          zoomOnDoubleClick={false}
        >
          <DiagramEdges
            edges={edges}
            nodes={nodes}
            selectedEdgeIds={selectedEdgeIds}
            onSelect={(edgeId) => {
              setSelection([], [edgeId])
              logInteraction(`Arrow selected: ${edgeId.slice(0, 8)}`)
            }}
          />
          <Background
            color="#d7d5ce"
            gap={22}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <MiniMap
            pannable
            zoomable
            nodeColor="#ffffff"
            maskColor="rgba(38, 42, 36, 0.08)"
          />
        </ReactFlow>
        <div className="zoom-toolbar" aria-label="Canvas zoom controls">
          <button
            type="button"
            title="Zoom out"
            onClick={() => changeZoom(1 / ZOOM_STEP)}
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className="zoom-level"
            title="Reset zoom to 100%"
            onClick={() => void flowInstance.current?.zoomTo(1, { duration: 180 })}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            title="Zoom in"
            onClick={() => changeZoom(ZOOM_STEP)}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            title="Fit board"
            onClick={() => void flowInstance.current?.fitView({ duration: 220, maxZoom: 1 })}
          >
            <Scan size={16} />
          </button>
        </div>
        {activeShape ? (
          <div
            className="drawing-layer"
            onPointerDown={beginDrawing}
            onPointerMove={continueDrawing}
            onPointerUp={finishDrawing}
            onPointerCancel={() => setDrawDraft(null)}
          >
            {drawDraft ? (
              <div
                className={`draw-preview draw-preview--${activeShape}`}
                style={{
                  left: Math.min(drawDraft.startX, drawDraft.currentX),
                  top: Math.min(drawDraft.startY, drawDraft.currentY),
                  width: Math.abs(drawDraft.currentX - drawDraft.startX),
                  height: Math.abs(drawDraft.currentY - drawDraft.startY),
                }}
              />
            ) : null}
          </div>
        ) : null}
        {nodes.length === 0 && hydrated ? (
          <div className="empty-canvas">
            <strong>Draw your first shape</strong>
            <span>Choose a shape on the left, then drag on the canvas.</span>
          </div>
        ) : null}
      </section>

      <aside className="properties-panel">
        <div className="panel-heading">
          <div>
            <h2>
              {selectedNode
                ? 'Node properties'
                : selectedEdge
                  ? 'Arrow selected'
                  : 'Nothing selected'}
            </h2>
          </div>
          <div className="panel-actions">
            <button
              className="icon-button danger"
              type="button"
              onClick={deleteSelected}
              disabled={selectedNodeIds.length + selectedEdgeIds.length === 0}
              title="Delete selection"
            >
              <Trash2 size={17} />
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => setInspectorOpen(false)}
              title="Close properties"
            >
              <X size={17} />
            </button>
          </div>
        </div>
        {selectedNode ? (
          <div className="property-fields">
            <div className="property-section-title">
              <span>Arrange</span>
              <AlignCenterHorizontal size={13} />
            </div>
            <dl className="measurements">
              <div><dt>W</dt><dd>{Math.round(selectedNode.width)}</dd></div>
              <div><dt>H</dt><dd>{Math.round(selectedNode.height)}</dd></div>
              <div><dt>X</dt><dd>{Math.round(selectedNode.x)}</dd></div>
              <div><dt>Y</dt><dd>{Math.round(selectedNode.y)}</dd></div>
            </dl>
            <div className="property-section-title"><span>Appearance</span></div>
            <label>
              Label
              <input
                value={selectedNode.label}
                onChange={(event) =>
                  updateSelectedNode({ label: event.target.value })
                }
              />
            </label>
            <div className={selectedNode.kind === 'text' ? undefined : 'field-row'}>
              {selectedNode.kind !== 'text' ? (
              <label>
                Fill
                <input
                  type="color"
                  value={selectedNode.fillColor}
                  onChange={(event) =>
                    updateSelectedNode({ fillColor: event.target.value })
                  }
                />
              </label>
              ) : null}
              <label>
                {selectedNode.kind === 'text' ? 'Text color' : 'Stroke'}
                <input
                  type="color"
                  value={selectedNode.strokeColor}
                  onChange={(event) =>
                    updateSelectedNode({ strokeColor: event.target.value })
                  }
                />
              </label>
            </div>
            {selectedNode.kind !== 'text' ? (
            <label>
              Stroke width
              <input
                type="range"
                min="1"
                max="6"
                value={selectedNode.strokeWidth}
                onChange={(event) =>
                  updateSelectedNode({ strokeWidth: Number(event.target.value) })
                }
              />
            </label>
            ) : null}
          </div>
        ) : selectedEdge ? (
          <p className="panel-hint">
            Use the delete button or press Delete to remove this arrow.
          </p>
        ) : (
          <p className="panel-hint">
            Select a node to edit its label and appearance.
          </p>
        )}
        <section className="interaction-log" aria-label="Interaction activity">
          <div className="interaction-log-heading">
            <h3>Activity</h3>
            <button type="button" onClick={clearInteractionLog}>Clear</button>
          </div>
          {interactionLog.length > 0 ? (
            <ol aria-live="polite">
              {[...interactionLog].reverse().map((entry) => (
                <li key={entry.id}>
                  <time>{entry.time}</time>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>No interactions recorded.</p>
          )}
        </section>
      </aside>

      <footer className="statusbar">
        <span>{nodes.length} nodes</span>
        <span>{edges.length} connectors</span>
        {activeShape ? (
          <span className="active-tool-status">
            Draw {shapeTools.find((tool) => tool.kind === activeShape)?.label}: drag on canvas
          </span>
        ) : arrowActive ? (
          <span className="active-tool-status">
            Arrow: drag from one node handle to another
          </span>
        ) : null}
        {interactionLog.length > 0 ? (
          <span className="interaction-status">
            {interactionLog.at(-1)?.message}
          </span>
        ) : null}
        <span className={`save-state save-state--${saveState}`}>
          <i aria-hidden="true" />
          {saveState === 'loading'
            ? 'Loading'
            : saveState === 'saving'
              ? 'Saving'
              : saveState === 'error'
                ? 'Save failed'
                : 'Saved locally'}
        </span>
      </footer>
    </main>
  )
}

export default App
