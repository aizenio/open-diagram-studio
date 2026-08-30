import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { IconButton } from '../../design-system'
import type { DiagramNodeKind } from '../../domain/diagram'
import { specFor } from '../../domain/node-kinds'
import {
  isSameTool,
  useToolStore,
  type FlyoutId,
  type Tool,
} from '../../stores/tool-store'
import { groupIcons, kindIcons } from './tool-rail-items'
import { ToolFlyout } from './ToolFlyout'

interface RailEntry {
  id: string
  label: string
  shortcut?: string
  icon: (typeof groupIcons)['select']
  tool: Tool
  /** Groups open a flyout as well as selecting their remembered tool. */
  flyout?: FlyoutId
}

/**
 * The floating tool rail.
 *
 * Every button resolves to a `Tool`; the rail never tracks "which tool is
 * active" itself. The accent pill is a single element that slides to whichever
 * button is active, measured from the DOM so the dividers and group sizes
 * cannot put it out of step.
 */
export function ToolRail() {
  const tool = useToolStore((state) => state.tool)
  const openFlyout = useToolStore((state) => state.openFlyout)
  const toggleTool = useToolStore((state) => state.toggleTool)
  const setTool = useToolStore((state) => state.setTool)
  const toggleFlyout = useToolStore((state) => state.toggleFlyout)
  const closeFlyout = useToolStore((state) => state.closeFlyout)
  const lastShape = useToolStore((state) => state.lastShape)
  const lastArchitecture = useToolStore((state) => state.lastArchitecture)
  const lastPen = useToolStore((state) => state.lastPen)
  const lineRouting = useToolStore((state) => state.lineRouting)
  const lineArrow = useToolStore((state) => state.lineArrow)

  const gridRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{
    x: number
    y: number
    size: number
  } | null>(null)
  const [animate, setAnimate] = useState(false)

  const shapeTool: Tool = { kind: 'shape', shape: lastShape }
  const architectureTool: Tool = { kind: 'shape', shape: lastArchitecture }
  const penTool: Tool = { kind: 'pen', pen: lastPen }
  const lineTool: Tool = {
    kind: 'line',
    routing: lineRouting,
    endArrow: lineArrow,
  }

  const entries: RailEntry[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: groupIcons.select,
      tool: { kind: 'select' },
    },
    {
      id: 'shapes',
      label: 'Shapes',
      shortcut: 'R',
      icon: kindIcons[lastShape] ?? groupIcons.shapes,
      tool: shapeTool,
      flyout: 'shapes',
    },
    {
      id: 'lines',
      label: 'Lines',
      shortcut: 'L',
      icon: groupIcons.lines,
      tool: lineTool,
      flyout: 'lines',
    },
    {
      id: 'connector',
      label: 'Connector',
      shortcut: 'A',
      icon: groupIcons.connector,
      tool: { kind: 'connector' },
    },
    {
      id: 'sticky',
      label: 'Sticky note',
      shortcut: 'N',
      icon: groupIcons.sticky,
      tool: { kind: 'shape', shape: 'stickyNote' },
      flyout: 'sticky',
    },
    {
      id: 'frame',
      label: 'Frame',
      shortcut: 'F',
      icon: groupIcons.frame,
      tool: { kind: 'shape', shape: 'frame' },
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: groupIcons.text,
      tool: { kind: 'shape', shape: 'text' },
    },
    {
      id: 'pen',
      label: 'Draw',
      shortcut: 'P',
      icon: groupIcons.pen,
      tool: penTool,
      flyout: 'pen',
    },
    {
      id: 'architecture',
      label: 'Architecture',
      shortcut: 'I',
      icon: kindIcons[lastArchitecture] ?? groupIcons.architecture,
      tool: architectureTool,
      flyout: 'architecture',
    },
  ]

  // Measured rather than computed from an index: the rail has dividers and a
  // group whose icon changes, so arithmetic would drift.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const active = grid.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) {
      setIndicator(null)
      return
    }
    const gridBox = grid.getBoundingClientRect()
    const box = active.getBoundingClientRect()
    setIndicator({
      x: box.left - gridBox.left,
      y: box.top - gridBox.top,
      size: box.width,
    })
  }, [tool, lastShape, lastArchitecture, lastPen])

  // Skip the animation on first paint, or the pill flies in from the corner.
  useLayoutEffect(() => {
    if (!indicator || animate) return
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(frame)
  }, [animate, indicator])

  const activeEntry = entries.find((entry) => isSameTool(entry.tool, tool))

  const press = (entry: RailEntry) => {
    if (entry.flyout) {
      // A group button selects its remembered tool and reveals the rest.
      setTool(entry.tool)
      toggleFlyout(entry.flyout)
      return
    }
    closeFlyout()
    toggleTool(entry.tool)
  }

  return (
    <div className="tool-rail-anchor">
      <aside className="chrome-card tool-panel" aria-label="Diagram tools">
        <div className="tool-grid" ref={gridRef}>
          {indicator ? (
            <span
              aria-hidden="true"
              className={`tool-indicator${animate ? ' tool-indicator--animated' : ''}`}
              style={{
                width: indicator.size,
                height: indicator.size,
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
              }}
            />
          ) : null}

          {entries.map((entry, index) => {
            const Icon = entry.icon
            const isActive = activeEntry?.id === entry.id
            return (
              <span key={entry.id} className="tool-slot">
                {index === 1 || index === 4 || index === 8 ? (
                  <span className="tool-divider" aria-hidden="true" />
                ) : null}
                <IconButton
                  size="lg"
                  label={entry.label}
                  shortcut={entry.shortcut}
                  tooltipPlacement="right"
                  icon={<Icon size={20} />}
                  data-active={isActive}
                  aria-pressed={isActive}
                  aria-expanded={
                    entry.flyout ? openFlyout === entry.flyout : undefined
                  }
                  onClick={() => press(entry)}
                />
                {entry.flyout ? (
                  <span className="tool-has-flyout" aria-hidden="true">
                    <ChevronRight size={10} />
                  </span>
                ) : null}
              </span>
            )
          })}
        </div>
      </aside>

      <ToolFlyout />
    </div>
  )
}

/** Shared by the flyout and the library so a shape button looks the same in both. */
export function ShapeButton({
  kind,
  active,
  onPick,
}: {
  kind: DiagramNodeKind
  active: boolean
  onPick: (kind: DiagramNodeKind) => void
}) {
  const Icon = kindIcons[kind]
  const spec = specFor(kind)
  return (
    <button
      type="button"
      className={`shape-button${active ? ' shape-button--active' : ''}`}
      aria-pressed={active}
      onClick={() => onPick(kind)}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{spec.label || kind}</span>
    </button>
  )
}
