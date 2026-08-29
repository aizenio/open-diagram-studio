import { ViewportPortal } from '@xyflow/react'
import type { DiagramEdge, DiagramNode } from '../../domain/diagram'

interface DiagramEdgesProps {
  edges: DiagramEdge[]
  nodes: DiagramNode[]
  selectedEdgeIds: string[]
  onSelect: (edgeId: string) => void
}

function endpoint(node: DiagramNode, handle: string | null | undefined) {
  const side = handle?.replace(/^(source|target)-/, '') ?? 'right'
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y, dx: 0, dy: -1 }
    case 'bottom':
      return {
        x: node.x + node.width / 2,
        y: node.y + node.height,
        dx: 0,
        dy: 1,
      }
    case 'left':
      return { x: node.x, y: node.y + node.height / 2, dx: -1, dy: 0 }
    default:
      return {
        x: node.x + node.width,
        y: node.y + node.height / 2,
        dx: 1,
        dy: 0,
      }
  }
}

export function DiagramEdges({
  edges,
  nodes,
  selectedEdgeIds,
  onSelect,
}: DiagramEdgesProps) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <ViewportPortal>
      <svg className="diagram-edges" aria-label="Diagram arrows">
        <defs>
          {/* userSpaceOnUse keeps the head a fixed size whatever the stroke
              width is, and the slight concave tail stops it reading as a
              blunt triangle at low zoom. */}
          <marker
            id="diagram-arrowhead"
            viewBox="0 0 11 8"
            markerWidth="11"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M0,0.5 L11,4 L0,7.5 L1.8,4 z"
              fill="context-stroke"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        {edges.map((edge) => {
          const sourceNode = nodeById.get(edge.source)
          const targetNode = nodeById.get(edge.target)
          if (!sourceNode || !targetNode) return null
          const source = endpoint(sourceNode, edge.sourceHandle)
          const target = endpoint(targetNode, edge.targetHandle)
          const distance = Math.max(
            48,
            Math.min(140, Math.hypot(target.x - source.x, target.y - source.y) / 2),
          )
          const path = `M ${source.x} ${source.y} C ${source.x + source.dx * distance} ${source.y + source.dy * distance}, ${target.x + target.dx * distance} ${target.y + target.dy * distance}, ${target.x} ${target.y}`
          const selected = selectedEdgeIds.includes(edge.id)

          return (
            <g
              key={edge.id}
              className={`diagram-edge${selected ? ' selected' : ''}`}
              data-edge-id={edge.id}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(edge.id)
              }}
            >
              <path className="diagram-edge-hit" d={path} />
              <path
                className="diagram-edge-line"
                d={path}
                markerEnd="url(#diagram-arrowhead)"
              />
            </g>
          )
        })}
      </svg>
    </ViewportPortal>
  )
}