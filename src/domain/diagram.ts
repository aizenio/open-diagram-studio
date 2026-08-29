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

/** How an edge is routed between its two endpoints. */
export type EdgeRouting = 'curved' | 'straight' | 'elbow'
export type ArrowHead = 'none' | 'arrow'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'

export interface DiagramEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null

  /* Every style below is optional so documents written before edges were
     stylable keep loading unchanged; `edgeDefaults` supplies the rest. */
  routing?: EdgeRouting
  startArrow?: ArrowHead
  endArrow?: ArrowHead
  strokeWidth?: number
  strokeStyle?: StrokeStyle
  /** Omitted means "follow the theme" — the one style that is not user data,
   *  so an edge stays visible when the board switches to dark. */
  strokeColor?: string
}

/** Applied wherever an edge leaves a style unset. */
export const edgeDefaults = {
  routing: 'curved',
  startArrow: 'none',
  endArrow: 'arrow',
  strokeWidth: 2,
  strokeStyle: 'solid',
} as const satisfies Partial<DiagramEdge>

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
