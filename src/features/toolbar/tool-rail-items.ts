import {
  ArrowUpRight,
  Box,
  Circle,
  Cloud,
  Database,
  Diamond,
  Hexagon,
  Highlighter,
  Minus,
  Monitor,
  MousePointer2,
  MoveRight,
  Pencil,
  PenTool,
  RectangleHorizontal,
  Server,
  Shapes,
  Square,
  SquareDashed,
  Star,
  StickyNote,
  Triangle,
  Type,
  Waypoints,
  Eraser,
  Cylinder,
  Spline,
  type LucideIcon,
} from 'lucide-react'
import type { DiagramNodeKind } from '../../domain/diagram'
import type { PenType } from '../../stores/tool-store'

/** Icon for every node kind, used by the rail, the flyouts and the library. */
export const kindIcons: Record<DiagramNodeKind, LucideIcon> = {
  text: Type,
  rectangle: RectangleHorizontal,
  roundedRectangle: Box,
  ellipse: Circle,
  diamond: Diamond,
  triangle: Triangle,
  parallelogram: Spline,
  cylinder: Cylinder,
  hexagon: Hexagon,
  star: Star,
  stickyNote: StickyNote,
  frame: SquareDashed,
  freehand: Pencil,
  client: Monitor,
  server: Server,
  database: Database,
  queue: Waypoints,
  cloud: Cloud,
}

export const penIcons: Record<PenType, LucideIcon> = {
  pen: Pencil,
  marker: PenTool,
  highlighter: Highlighter,
  eraser: Eraser,
}

export const penLabels: Record<PenType, string> = {
  pen: 'Pen',
  marker: 'Marker',
  highlighter: 'Highlighter',
  eraser: 'Eraser',
}

export const groupIcons = {
  select: MousePointer2,
  shapes: Shapes,
  lines: Minus,
  connector: ArrowUpRight,
  sticky: StickyNote,
  frame: SquareDashed,
  text: Type,
  pen: Pencil,
  architecture: Server,
  square: Square,
  arrow: MoveRight,
} as const
