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
  ChevronRight,
  ArrowUpRight,
  Circle,
  Cloud,
  Database,
  Diamond,
  Download,
  Keyboard,
  Monitor,
  Moon,
  MousePointer2,
  PanelRight,
  RectangleHorizontal,
  Scan,
  Server,
  Sun,
  Trash2,
  Type,
  Waypoints,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import './App.css'
import {
  Button,
  ColorInput,
  Field,
  IconButton,
  RangeInput,
  SwatchPicker,
  TextInput,
  duration,
  fillSwatches,
  readToken,
  strokeSwatches,
} from './design-system'
import {
  useShortcuts,
  type ShortcutBinding,
} from './features/shortcuts/use-shortcuts'
import { ShortcutsDialog } from './features/shortcuts/ShortcutsDialog'
import { diagramRepository } from './data/diagram-repository'
import type { DiagramDocument, DiagramNodeKind } from './domain/diagram'
import { resolveDrawRect, shouldConstrain } from './domain/drawing'
import { DiagramEdges } from './features/diagram/DiagramEdges'
import { DiagramNode } from './features/diagram/DiagramNode'
import {
  type FlowDiagramNode,
  toFlowNode,
  useDiagramStore,
} from './stores/diagram-store'
import { applyTheme, useUiStore, type ThemePreference } from './stores/ui-store'

const reportFlowError = (code: string, message: string) => {
  console.error(`React Flow ${code}: ${message}`)
}
type Tool = {
  kind: DiagramNodeKind
  label: string
  icon: LucideIcon
  shortcut?: string
}
type DrawDraft = {
  startX: number
  startY: number
  currentX: number
  currentY: number
  /** Shift was held — square the shape off. Tracked on the draft so the
   *  preview updates even when Shift is pressed without moving the pointer. */
  constrain: boolean
}

const nodeTypes = { diagramNode: DiagramNode }

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? '' : 's'}`

const themeIcons: Record<ThemePreference, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}
const themeNames: Record<ThemePreference, string> = {
  light: 'light',
  dark: 'dark',
  system: 'system',
}
const EXPORT_TIMEOUT_MS = 5000
const MIN_ZOOM = 0.05
const MAX_ZOOM = 8
const ZOOM_STEP = 1.2

const shapeTools: Tool[] = [
  { kind: 'text', label: 'Text', icon: Type, shortcut: 'T' },
  {
    kind: 'rectangle',
    label: 'Rectangle',
    icon: RectangleHorizontal,
    shortcut: 'R',
  },
  { kind: 'roundedRectangle', label: 'Rounded', icon: Box },
  { kind: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'O' },
  { kind: 'diamond', label: 'Decision', icon: Diamond, shortcut: 'D' },
]

/** The domain has always supported these; until now nothing created them. */
const architectureTools: Tool[] = [
  { kind: 'client', label: 'Client', icon: Monitor },
  { kind: 'server', label: 'Server', icon: Server },
  { kind: 'database', label: 'Database', icon: Database },
  { kind: 'queue', label: 'Queue', icon: Waypoints },
  { kind: 'cloud', label: 'Cloud', icon: Cloud },
]

/** Every tool that draws by dragging — used to name the active one. */
const drawTools: Tool[] = [...shapeTools, ...architectureTools]

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
  const selectAll = useDiagramStore((state) => state.selectAll)
  const clearSelection = useDiagramStore((state) => state.clearSelection)
  const duplicateSelected = useDiagramStore((state) => state.duplicateSelected)
  const copySelected = useDiagramStore((state) => state.copySelected)
  const pasteClipboard = useDiagramStore((state) => state.pasteClipboard)
  const moveSelected = useDiagramStore((state) => state.moveSelected)
  const deleteSelected = useDiagramStore((state) => state.deleteSelected)
  const updateSelectedNode = useDiagramStore(
    (state) => state.updateSelectedNode,
  )
  const theme = useUiStore((state) => state.theme)
  const cycleTheme = useUiStore((state) => state.cycleTheme)
  const flowInstance = useRef<ReactFlowInstance<FlowDiagramNode> | null>(null)
  const [activeShape, setActiveShape] = useState<DiagramNodeKind | null>(null)
  const [arrowActive, setArrowActive] = useState(false)
  const [drawDraft, setDrawDraft] = useState<DrawDraft | null>(null)
  const [zoom, setZoom] = useState(1)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

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

  // Keeps <html data-theme> in step with the store, including on first mount
  // where it re-affirms whatever the pre-paint script in index.html set.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

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

  /** Picks a drawing tool outright — what a keyboard shortcut should do. */
  const pickShape = useCallback((kind: DiagramNodeKind | null) => {
    setArrowActive(false)
    setDrawDraft(null)
    setActiveShape(kind)
  }, [])

  /** Clicking the active tool again returns to Select. */
  const toggleShape = useCallback((kind: DiagramNodeKind) => {
    setArrowActive(false)
    setDrawDraft(null)
    setActiveShape((current) => (current === kind ? null : kind))
  }, [])

  const pickArrow = useCallback(() => {
    setActiveShape(null)
    setDrawDraft(null)
    setArrowActive(true)
  }, [])

  const resetTools = useCallback(() => {
    setActiveShape(null)
    setArrowActive(false)
    setDrawDraft(null)
    cancelConnector()
  }, [cancelConnector])

  /** Escape unwinds one layer at a time: dialog, then tool, then selection. */
  const escape = useCallback(() => {
    if (shortcutsOpen) {
      setShortcutsOpen(false)
      return
    }
    resetTools()
    clearSelection()
  }, [clearSelection, resetTools, shortcutsOpen])

  const fitBoard = useCallback(() => {
    void flowInstance.current?.fitView({
      duration: duration.slow,
      maxZoom: 1,
    })
  }, [])

  /** Arrow keys nudge the selection, but only when there is one — otherwise
   *  the event falls through to React Flow. */
  const nudge = useCallback(
    (deltaX: number, deltaY: number) => (event: KeyboardEvent) => {
      if (selectedNodeIds.length === 0) return
      event.preventDefault()
      event.stopPropagation()
      moveSelected(deltaX, deltaY)
    },
    [moveSelected, selectedNodeIds.length],
  )

  /** One list drives both the keyboard and the shortcuts dialog, so the help
   *  can never describe a binding the app does not actually have. */
  const bindings: ShortcutBinding[] = [
    // Tools
    { key: 'v', run: () => pickShape(null), title: 'Select', group: 'Tools' },
    { key: 't', run: () => pickShape('text'), title: 'Text', group: 'Tools' },
    {
      key: 'r',
      run: () => pickShape('rectangle'),
      title: 'Rectangle',
      group: 'Tools',
    },
    {
      key: 'o',
      run: () => pickShape('ellipse'),
      title: 'Ellipse',
      group: 'Tools',
    },
    {
      key: 'd',
      run: () => pickShape('diamond'),
      title: 'Decision',
      group: 'Tools',
    },
    { key: 'a', run: pickArrow, title: 'Arrow', group: 'Tools' },

    // Edit
    {
      key: 'a',
      mod: true,
      run: selectAll,
      title: 'Select all',
      group: 'Edit',
    },
    {
      key: 'd',
      mod: true,
      run: duplicateSelected,
      title: 'Duplicate',
      group: 'Edit',
    },
    { key: 'c', mod: true, run: copySelected, title: 'Copy', group: 'Edit' },
    {
      key: 'v',
      mod: true,
      run: pasteClipboard,
      title: 'Paste',
      group: 'Edit',
    },
    {
      key: ['backspace', 'delete'],
      run: deleteSelected,
      title: 'Delete selection',
      group: 'Edit',
    },
    {
      key: 'escape',
      run: escape,
      title: 'Cancel tool or selection',
      group: 'Edit',
    },
    {
      key: 'arrowleft',
      preventDefault: false,
      run: nudge(-10, 0),
      title: 'Nudge selection',
      group: 'Edit',
    },
    { key: 'arrowright', preventDefault: false, run: nudge(10, 0) },
    { key: 'arrowup', preventDefault: false, run: nudge(0, -10) },
    { key: 'arrowdown', preventDefault: false, run: nudge(0, 10) },

    // View
    {
      key: ['+', '='],
      mod: true,
      display: '+',
      run: () => changeZoom(ZOOM_STEP),
      title: 'Zoom in',
      group: 'View',
    },
    {
      key: '-',
      mod: true,
      run: () => changeZoom(1 / ZOOM_STEP),
      title: 'Zoom out',
      group: 'View',
    },
    {
      key: '0',
      mod: true,
      run: () =>
        void flowInstance.current?.zoomTo(1, { duration: duration.base }),
      title: 'Reset zoom to 100%',
      group: 'View',
    },
    {
      key: '1',
      shift: true,
      run: fitBoard,
      title: 'Fit board',
      group: 'View',
    },
    {
      key: 'p',
      mod: true,
      shift: true,
      run: () => setInspectorOpen((open) => !open),
      title: 'Toggle properties panel',
      group: 'View',
    },
    {
      key: '?',
      run: () => setShortcutsOpen((open) => !open),
      title: 'Keyboard shortcuts',
      group: 'View',
    },
  ]

  useShortcuts(bindings)

  // Shift can be pressed or released without the pointer moving, so the
  // pointermove handler alone would leave the preview out of step with it.
  const isDrawing = drawDraft !== null
  useEffect(() => {
    if (!isDrawing || !activeShape) return
    const syncConstraint = (event: KeyboardEvent) => {
      if (event.key !== 'Shift') return
      setDrawDraft((draft) =>
        draft
          ? {
              ...draft,
              constrain: shouldConstrain(
                activeShape,
                event.type === 'keydown',
              ),
            }
          : null,
      )
    }
    window.addEventListener('keydown', syncConstraint)
    window.addEventListener('keyup', syncConstraint)
    return () => {
      window.removeEventListener('keydown', syncConstraint)
      window.removeEventListener('keyup', syncConstraint)
    }
  }, [activeShape, isDrawing])

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

    // Exports always render on the light theme. A PNG ends up in a document or
    // a deck, where a dark board is the wrong artefact — and edge colours do
    // follow the theme, so a dark-mode export would lose its connectors
    // against a light page.
    const root = window.document.documentElement
    const previousTheme = root.getAttribute('data-theme')
    const restoreTheme = () => {
      if (previousTheme === null) {
        root.removeAttribute('data-theme')
      } else {
        root.setAttribute('data-theme', previousTheme)
      }
    }
    root.setAttribute('data-theme', 'light')

    // html-to-image rasterises through an <img>, which never settles while the
    // document is hidden. Without this the board would be stranded in the
    // light theme; restoreTheme is idempotent, so the finally below is free to
    // run as well.
    const safety = window.setTimeout(restoreTheme, EXPORT_TIMEOUT_MS)

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: readToken('--ds-color-canvas', '#f4f5f8'),
      })
      const link = window.document.createElement('a')
      link.href = dataUrl
      link.download = `${title.trim() || 'diagram'}.png`
      link.click()
    } catch (error) {
      logInteraction('PNG export failed')
      console.error('PNG export failed', error)
    } finally {
      window.clearTimeout(safety)
      restoreTheme()
    }
  }

  const beginDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeShape) return
    // Capture the pointer: the chrome floats over the canvas, so without this
    // a drag that ends over the inspector or the tool rail never delivers its
    // pointerup and the draft gets stuck on screen.
    event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    setDrawDraft({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      constrain: shouldConstrain(activeShape, event.shiftKey),
    })
  }

  const continueDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawDraft || !activeShape) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setDrawDraft((draft) =>
      draft
        ? {
            ...draft,
            currentX: event.clientX - bounds.left,
            currentY: event.clientY - bounds.top,
            constrain: shouldConstrain(activeShape, event.shiftKey),
          }
        : null,
    )
  }

  const finishDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeShape || !drawDraft || !flowInstance.current) return
    const bounds = event.currentTarget.getBoundingClientRect()

    // Resolve the drag in screen space, then convert the resulting corners:
    // React Flow's zoom is uniform, so a square on screen is a square on the
    // board, and the committed node lands exactly where the preview was.
    const rect = resolveDrawRect(
      drawDraft.startX,
      drawDraft.startY,
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      // The preview is the contract: commit whatever the user was shown. The
      // draft already tracks Shift via both pointermove and the key listener;
      // the pointerup is only consulted for a press at the very last instant.
      drawDraft.constrain || shouldConstrain(activeShape, event.shiftKey),
    )
    const start = flowInstance.current.screenToFlowPosition({
      x: bounds.left + rect.left,
      y: bounds.top + rect.top,
    })
    const end = flowInstance.current.screenToFlowPosition({
      x: bounds.left + rect.left + rect.width,
      y: bounds.top + rect.top + rect.height,
    })
    const draggedWidth = end.x - start.x
    const draggedHeight = end.y - start.y
    const wasClick = draggedWidth < 12 && draggedHeight < 12
    const defaultWidth =
      activeShape === 'text' ? 200 : activeShape === 'diamond' ? 120 : 156
    const defaultHeight =
      activeShape === 'text' ? 40 : activeShape === 'diamond' ? 120 : 84

    drawNode(
      activeShape,
      wasClick ? start.x - defaultWidth / 2 : start.x,
      wasClick ? start.y - defaultHeight / 2 : start.y,
      wasClick ? defaultWidth : Math.max(44, draggedWidth),
      wasClick ? defaultHeight : Math.max(44, draggedHeight),
    )
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDrawDraft(null)
    setActiveShape(null)
  }

  /** Position and size are editable, not just displayed. */
  const updateGeometry =
    (key: 'x' | 'y' | 'width' | 'height') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      if (!Number.isFinite(value)) return
      const minimum = key === 'width' || key === 'height' ? 20 : -100000
      updateSelectedNode({ [key]: Math.max(minimum, Math.round(value)) })
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
    tools.map(({ kind, label, icon: Icon, shortcut }) => (
      <IconButton
        key={kind}
        size="lg"
        label={drawable ? `Draw ${label}` : `Add ${label}`}
        shortcut={shortcut}
        tooltipPlacement="right"
        icon={<Icon size={20} />}
        active={activeShape === kind}
        aria-pressed={drawable ? activeShape === kind : undefined}
        onClick={() => (drawable ? toggleShape(kind) : addNode(kind))}
      />
    ))

  return (
    <main
      className={`ds-root studio-shell${inspectorOpen ? '' : ' inspector-closed'}`}
    >
      <header className="chrome-card topbar-identity">
        <strong className="brand-copy">Diagram Studio</strong>
        <span className="workspace-name">
          <input
            className="diagram-title"
            aria-label="Diagram title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Cloud size={14} aria-label="Saved to local workspace" />
        </span>
      </header>

      <div className="chrome-card topbar-actions">
        <IconButton
          label={`Change theme, currently ${themeNames[theme]}`}
          tooltipPlacement="bottom"
          icon={(() => {
            const ThemeIcon = themeIcons[theme]
            return <ThemeIcon size={16} />
          })()}
          onClick={cycleTheme}
        />
        <IconButton
          label="Keyboard shortcuts"
          shortcut="?"
          tooltipPlacement="bottom"
          icon={<Keyboard size={16} />}
          active={shortcutsOpen}
          onClick={() => setShortcutsOpen((open) => !open)}
        />
        <span className="topbar-divider" aria-hidden="true" />
        <Button
          variant="ghost"
          icon={<Download size={14} />}
          onClick={exportJson}
          title="Download the diagram as a JSON backup"
        >
          JSON
        </Button>
        <Button
          variant="primary"
          icon={<Download size={14} />}
          onClick={() => void exportPng()}
          title="Download the board as an image"
        >
          PNG
        </Button>
        {!inspectorOpen ? (
          <IconButton
            label="Show properties"
            tooltipPlacement="bottom"
            icon={<PanelRight size={16} />}
            onClick={() => setInspectorOpen(true)}
          />
        ) : null}
      </div>

      <aside className="chrome-card tool-panel" aria-label="Diagram tools">
        <div className="tool-grid">
          <IconButton
            size="lg"
            label="Select"
            shortcut="V"
            tooltipPlacement="right"
            icon={<MousePointer2 size={18} />}
            active={!activeShape && !arrowActive}
            aria-pressed={!activeShape && !arrowActive}
            onClick={resetTools}
          />
          {renderTools(shapeTools, true)}
          <IconButton
            size="lg"
            label="Draw arrow"
            shortcut="A"
            tooltipPlacement="right"
            icon={<ArrowUpRight size={20} />}
            active={arrowActive}
            aria-pressed={arrowActive}
            onClick={() => (arrowActive ? resetTools() : pickArrow())}
          />
          <span className="tool-divider" aria-hidden="true" />
          {renderTools(architectureTools, true)}
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
          attributionPosition="bottom-center"
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
          <Background gap={24} size={1} variant={BackgroundVariant.Dots} />
          <MiniMap pannable zoomable />
        </ReactFlow>
        <div
          className="zoom-toolbar"
          role="toolbar"
          aria-label="Canvas zoom controls"
        >
          <IconButton
            label="Zoom out"
            tooltipPlacement="top"
            icon={<ZoomOut size={16} />}
            onClick={() => changeZoom(1 / ZOOM_STEP)}
          />
          <Button
            className="zoom-level ds-numeric"
            title="Reset zoom to 100%"
            onClick={() =>
              void flowInstance.current?.zoomTo(1, { duration: duration.base })
            }
          >
            {Math.round(zoom * 100)}%
          </Button>
          <IconButton
            label="Zoom in"
            tooltipPlacement="top"
            icon={<ZoomIn size={16} />}
            onClick={() => changeZoom(ZOOM_STEP)}
          />
          <IconButton
            label="Fit board"
            tooltipPlacement="top"
            icon={<Scan size={16} />}
            onClick={() =>
              void flowInstance.current?.fitView({
                duration: duration.slow,
                maxZoom: 1,
              })
            }
          />
        </div>
        {activeShape ? (
          <div
            className="drawing-layer"
            onPointerDown={beginDrawing}
            onPointerMove={continueDrawing}
            onPointerUp={finishDrawing}
            onPointerCancel={() => setDrawDraft(null)}
            onLostPointerCapture={() => setDrawDraft(null)}
          >
            {drawDraft ? (
              <div
                className={`draw-preview draw-preview--${activeShape}`}
                style={resolveDrawRect(
                  drawDraft.startX,
                  drawDraft.startY,
                  drawDraft.currentX,
                  drawDraft.currentY,
                  drawDraft.constrain,
                )}
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

      <aside className="chrome-card properties-panel">
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
            <IconButton
              label="Delete selection"
              tone="danger"
              tooltipPlacement="bottom"
              icon={<Trash2 size={16} />}
              onClick={deleteSelected}
              disabled={selectedNodeIds.length + selectedEdgeIds.length === 0}
            />
            <IconButton
              label="Close properties"
              tooltipPlacement="bottom"
              icon={<X size={16} />}
              onClick={() => setInspectorOpen(false)}
            />
          </div>
        </div>
        {selectedNode ? (
          <div className="property-fields">
            <div className="property-section-title">
              <span>Arrange</span>
              <AlignCenterHorizontal size={13} aria-hidden="true" />
            </div>
            <div className="field-row">
              <Field label="X" htmlFor="node-x">
                <TextInput
                  id="node-x"
                  type="number"
                  className="ds-numeric"
                  value={Math.round(selectedNode.x)}
                  onChange={updateGeometry('x')}
                />
              </Field>
              <Field label="Y" htmlFor="node-y">
                <TextInput
                  id="node-y"
                  type="number"
                  className="ds-numeric"
                  value={Math.round(selectedNode.y)}
                  onChange={updateGeometry('y')}
                />
              </Field>
            </div>
            <div className="field-row">
              <Field label="Width" htmlFor="node-w">
                <TextInput
                  id="node-w"
                  type="number"
                  min={20}
                  className="ds-numeric"
                  value={Math.round(selectedNode.width)}
                  onChange={updateGeometry('width')}
                />
              </Field>
              <Field label="Height" htmlFor="node-h">
                <TextInput
                  id="node-h"
                  type="number"
                  min={20}
                  className="ds-numeric"
                  value={Math.round(selectedNode.height)}
                  onChange={updateGeometry('height')}
                />
              </Field>
            </div>

            <div className="property-section-title"><span>Appearance</span></div>
            <Field label="Label" htmlFor="node-label">
              <TextInput
                id="node-label"
                value={selectedNode.label}
                placeholder="Untitled"
                onChange={(event) =>
                  updateSelectedNode({ label: event.target.value })
                }
              />
            </Field>

            {selectedNode.kind !== 'text' ? (
              <Field label="Fill">
                <SwatchPicker
                  label="Fill colour presets"
                  value={selectedNode.fillColor}
                  options={fillSwatches}
                  onSelect={(fillColor) => updateSelectedNode({ fillColor })}
                />
                <ColorInput
                  aria-label="Custom fill colour"
                  value={selectedNode.fillColor}
                  onChange={(event) =>
                    updateSelectedNode({ fillColor: event.target.value })
                  }
                />
              </Field>
            ) : null}

            <Field
              label={selectedNode.kind === 'text' ? 'Text colour' : 'Stroke'}
            >
              <SwatchPicker
                label={
                  selectedNode.kind === 'text'
                    ? 'Text colour presets'
                    : 'Stroke colour presets'
                }
                value={selectedNode.strokeColor}
                options={strokeSwatches}
                onSelect={(strokeColor) => updateSelectedNode({ strokeColor })}
              />
              <ColorInput
                aria-label={
                  selectedNode.kind === 'text'
                    ? 'Custom text colour'
                    : 'Custom stroke colour'
                }
                value={selectedNode.strokeColor}
                onChange={(event) =>
                  updateSelectedNode({ strokeColor: event.target.value })
                }
              />
            </Field>

            {selectedNode.kind !== 'text' ? (
              <Field
                htmlFor="node-stroke-width"
                label={
                  <span className="field-label-row">
                    Stroke width
                    <span className="field-value ds-numeric">
                      {selectedNode.strokeWidth}
                    </span>
                  </span>
                }
              >
                <RangeInput
                  id="node-stroke-width"
                  min={1}
                  max={6}
                  value={selectedNode.strokeWidth}
                  onChange={(event) =>
                    updateSelectedNode({
                      strokeWidth: Number(event.target.value),
                    })
                  }
                />
              </Field>
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
        <details className="interaction-log">
          <summary className="interaction-log-summary">
            <ChevronRight
              className="interaction-log-chevron"
              size={13}
              aria-hidden="true"
            />
            Activity
            {interactionLog.length > 0 ? (
              <span className="interaction-log-count">
                {interactionLog.length}
              </span>
            ) : null}
          </summary>
          {interactionLog.length > 0 ? (
            <>
              <ol aria-live="polite">
                {[...interactionLog].reverse().map((entry) => (
                  <li key={entry.id}>
                    <time>{entry.time}</time>
                    <span>{entry.message}</span>
                  </li>
                ))}
              </ol>
              <button
                className="interaction-log-clear"
                type="button"
                onClick={clearInteractionLog}
              >
                Clear activity
              </button>
            </>
          ) : (
            <p>No interactions recorded.</p>
          )}
        </details>
      </aside>

      <ShortcutsDialog
        open={shortcutsOpen}
        bindings={bindings}
        onClose={() => setShortcutsOpen(false)}
      />

      <footer className="chrome-card statusbar">
        <span>{plural(nodes.length, 'node')}</span>
        <span>{plural(edges.length, 'connector')}</span>
        {activeShape ? (
          <span className="active-tool-status">
            Draw {drawTools.find((tool) => tool.kind === activeShape)?.label}:
            drag on canvas
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
        <span
          className={`save-state save-state--${saveState}`}
          role="status"
          aria-live="polite"
        >
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
