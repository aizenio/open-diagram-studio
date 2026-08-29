export type DiagramNodeKind =
  | 'text'
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'diamond'
  | 'client'
  | 'server'
  | 'database'
  | 'queue'
  | 'cloud'

export interface DiagramNode {
  id: string
  kind: DiagramNodeKind
  x: number
  y: number
  width: number
  height: number
  label: string
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export interface DiagramDocument {
  id: string
  title: string
  version: 1
  updatedAt: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export function createBlankDocument(): DiagramDocument {
  return {
    id: 'current-diagram',
    title: 'Untitled diagram',
    version: 1,
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
  }
}
