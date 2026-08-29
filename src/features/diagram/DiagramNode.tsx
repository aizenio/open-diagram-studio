import { useState, type KeyboardEvent } from 'react'
import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from '@xyflow/react'
import {
  Cloud,
  Database,
  Monitor,
  Server,
  Waypoints,
} from 'lucide-react'
import {
  type FlowDiagramNode,
  useDiagramStore,
} from '../../stores/diagram-store'

const architectureIcons = {
  client: Monitor,
  server: Server,
  database: Database,
  queue: Waypoints,
  cloud: Cloud,
}

const connectorPositions = [
  ['top', Position.Top],
  ['right', Position.Right],
  ['bottom', Position.Bottom],
  ['left', Position.Left],
] as const

export function DiagramNode({ id, data, selected }: NodeProps<FlowDiagramNode>) {
  const [editing, setEditing] = useState(data.kind === 'text' && selected)
  const updateNodeLabel = useDiagramStore((state) => state.updateNodeLabel)
  const removeNode = useDiagramStore((state) => state.removeNode)
  const resizeTextNode = useDiagramStore((state) => state.resizeTextNode)
  const clickConnector = useDiagramStore((state) => state.clickConnector)
  const pendingConnector = useDiagramStore((state) => state.pendingConnector)
  const Icon =
    data.kind in architectureIcons
      ? architectureIcons[data.kind as keyof typeof architectureIcons]
      : null

  return (
    <div
      className={`diagram-node diagram-node--${data.kind}`}
      style={data.kind === 'text' ? { color: data.strokeColor } : undefined}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={data.kind === 'text' ? 80 : 88}
        minHeight={data.kind === 'text' ? 32 : 56}
        lineClassName="node-resizer-line"
        handleClassName="node-resizer-handle"
      />
      {connectorPositions.map(([side, position]) => (
        <Handle
          key={side}
          id={side}
          className={`connector-handle${
            pendingConnector?.nodeId === id &&
            pendingConnector.handleId === side
              ? ' connector-handle--pending'
              : ''
          }`}
          type="source"
          position={position}
          title={`Connect from ${side}`}
          onClick={(event) => {
            event.stopPropagation()
            clickConnector(id, side)
          }}
        />
      ))}
      <div
        className={`node-shape node-shape--${data.kind}`}
        style={{
          backgroundColor: data.fillColor,
          borderColor: data.strokeColor,
          borderWidth: data.strokeWidth,
        }}
      />
      <div className="node-content">
        {Icon && !editing ? (
          <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
        ) : null}
        {editing ? (
          <textarea
            autoFocus
            className="node-label-input nodrag nopan nowheel"
            aria-label="Node text"
            value={data.label}
            placeholder="Type something"
            onChange={(event) => {
              const value = event.target.value
              updateNodeLabel(id, value)
              if (data.kind === 'text') {
                const lines = value.split('\n')
                const longestLine = Math.max(
                  1,
                  ...lines.map((line) => line.length),
                )
                resizeTextNode(
                  id,
                  Math.min(640, Math.max(80, longestLine * 10 + 20)),
                  Math.min(400, Math.max(40, lines.length * 23 + 16)),
                )
              }
            }}
            onBlur={() => {
              if (data.kind === 'text' && !data.label.trim()) {
                removeNode(id)
                return
              }
              setEditing(false)
            }}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.blur()
              }
              if (event.key === 'Escape') {
                event.currentTarget.blur()
              }
            }}
          />
        ) : (
          <span
            className="node-label"
            onDoubleClick={() => setEditing(true)}
          >
            {data.label || 'Double-click to type'}
          </span>
        )}
      </div>
    </div>
  )
}
