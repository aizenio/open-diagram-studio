# Diagram Studio — Architecture & Implementation Specification

## 1. Purpose

Diagram Studio is a **local-first technical diagramming application** inspired by tools like Excalidraw, but focused on day-to-day engineering and architecture work.

The application should make it fast to create:

- Flow diagrams
- System architecture diagrams
- Cloud architecture diagrams
- Kubernetes diagrams
- CI/CD flows
- Network diagrams
- Incident timelines and troubleshooting flows
- Simple process diagrams
- Free-form whiteboard sketches

The first version should be **simple, fast, local-first, and fully usable without a backend**.

> AI capabilities are explicitly out of scope.

---

# 2. Product Principles

The application should follow these principles:

1. **Local first**
   - No account required.
   - No server required.
   - Diagrams should be persisted automatically in the browser.

2. **Fast startup**
   - Opening the application should immediately show the diagram workspace.

3. **Low friction**
   - Users should be able to draw quickly using mouse and keyboard shortcuts.

4. **Structured but flexible**
   - Support normal shapes and free-form drawing.
   - Architecture icons can be added as reusable nodes.

5. **Offline capable**
   - Core drawing functionality should work without internet access.

6. **Portable files**
   - Users should be able to export and import their diagrams.

7. **Maintainable architecture**
   - UI, canvas logic, persistence, export logic, and domain models should remain clearly separated.

---

# 3. Scope

## 3.1 Version 1 — In Scope

### Canvas

- Infinite canvas
- Pan
- Zoom
- Fit to content
- Reset zoom
- Canvas grid toggle
- Snap-to-grid toggle

### Drawing Elements

- Rectangle
- Rounded rectangle
- Ellipse / circle
- Diamond
- Line
- Arrow
- Text
- Freehand / pencil
- Image
- Architecture icon node

### Element Editing

- Move
- Resize
- Rotate
- Delete
- Duplicate
- Copy / paste
- Multi-select
- Group / ungroup
- Lock / unlock
- Bring forward
- Send backward
- Bring to front
- Send to back

### Connectors

- Connect one shape to another
- Connector should remain attached when shapes move
- Arrow start/end styles
- Straight connector
- Elbow connector
- Curved connector
- Optional connector label

### Styling

- Stroke color
- Fill color
- Stroke width
- Stroke style
- Opacity
- Font size
- Font family
- Text alignment
- Arrow style

### Productivity

- Undo
- Redo
- Keyboard shortcuts
- Select all
- Delete selected
- Duplicate selected
- Zoom shortcuts
- Search diagrams by title

### Diagram Management

- Create diagram
- Rename diagram
- Duplicate diagram
- Delete diagram
- List recent diagrams
- Auto-save
- Manual save indication
- Last modified timestamp

### Import / Export

- Export PNG
- Export SVG
- Export native JSON file
- Import native JSON file

### Architecture Components

Initial reusable palette:

- Generic server
- Database
- Cache
- Load balancer
- API gateway
- Queue
- Storage
- User/client
- Browser
- Container
- Kubernetes pod
- Kubernetes service
- Kubernetes deployment
- Kubernetes ingress
- Cloud
- Firewall
- Network

The initial icon set should remain generic where possible.

---

## 3.2 Version 1 — Out of Scope

Do not implement the following in V1:

- AI
- Real-time collaboration
- Multiplayer cursors
- Comments
- User accounts
- Cloud sync
- Team workspaces
- Permissions
- Mobile app
- Backend database
- Sharing links
- Presentation mode
- Advanced animation
- Automatic diagram layout engine
- Visio import
- Draw.io import
- Mermaid import/export

These may be added later.

---

# 4. Recommended Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS

## Canvas / Diagram Engine

Recommended approach:

### Primary recommendation

Use **React Flow** for structured nodes and connectors, combined with a small custom drawing layer for freehand drawing if required.

Why:

- Strong node/edge model
- Dragging and selection support
- Handles and connections
- Zoom/pan support
- Custom node components
- Good architecture diagram fit
- Easier to maintain than building a canvas engine from scratch

### Alternative

If free-form sketching is the dominant requirement, consider embedding Excalidraw as the canvas engine.

For this project, the preferred architecture is:

> React Flow for structured diagram elements + optional freehand canvas overlay.

## Local Persistence

Use:

- IndexedDB
- Dexie.js

Reason:

- Better than localStorage for larger diagrams
- Supports structured querying
- Handles many saved diagrams
- Supports future migration to backend/cloud sync

## Export

Use:

- SVG export from canvas representation
- DOM-to-image / html-to-image for PNG where appropriate
- Native JSON serializer for project files

## Testing

- Vitest
- React Testing Library
- Playwright

## Code Quality

- ESLint
- Prettier
- TypeScript strict mode

---

# 5. High-Level Architecture

```text
+-------------------------------------------------------+
|                    React Application                  |
|                                                       |
|  +-------------------+    +------------------------+  |
|  | Workspace Shell   |    | Diagram Library        |  |
|  |                   |    |                        |  |
|  | Toolbar           |    | Create                 |  |
|  | Sidebar           |    | Rename                 |  |
|  | Properties Panel  |    | Duplicate              |  |
|  | Status Bar        |    | Delete                 |  |
|  +---------+---------+    +-----------+------------+  |
|            |                          |               |
|            v                          v               |
|  +-------------------------------------------------+ |
|  |              Diagram Editor Core                | |
|  |                                                 | |
|  | Nodes                                           | |
|  | Edges                                           | |
|  | Selection                                       | |
|  | Grouping                                        | |
|  | Keyboard commands                               | |
|  | Undo / Redo                                     | |
|  +----------------------+--------------------------+ |
|                         |                            |
|                         v                            |
|  +-------------------------------------------------+ |
|  |               Application State                 | |
|  |                    Zustand                      | |
|  +----------------------+--------------------------+ |
|                         |                            |
|            +------------+-------------+              |
|            |                          |              |
|            v                          v              |
|  +-------------------+      +---------------------+  |
|  | Persistence Layer |      | Import / Export     |  |
|  | Dexie / IndexedDB |      | JSON / PNG / SVG    |  |
|  +-------------------+      +---------------------+  |
+-------------------------------------------------------+
```

---

# 6. Application Modules

The codebase should be divided into the following modules.

## 6.1 App Shell

Responsibilities:

- Application routing
- Global layout
- Theme
- Error boundaries
- Global keyboard listeners

Suggested location:

```text
src/app/
```

---

## 6.2 Diagram Workspace

Responsibilities:

- Main canvas page
- Toolbar
- Canvas
- Left component palette
- Right properties panel
- Bottom status bar

Suggested location:

```text
src/features/workspace/
```

---

## 6.3 Diagram Engine

Responsibilities:

- Nodes
- Edges
- Selection
- Dragging
- Resizing
- Rotation
- Grouping
- Layering
- Connector logic
- Viewport state

Suggested location:

```text
src/features/diagram/
```

This module should not know about IndexedDB directly.

---

## 6.4 Diagram Library

Responsibilities:

- Create diagram
- List diagrams
- Rename diagram
- Duplicate diagram
- Delete diagram
- Search diagrams
- Open diagram

Suggested location:

```text
src/features/library/
```

---

## 6.5 Persistence

Responsibilities:

- IndexedDB setup
- Diagram repository
- Settings repository
- Autosave
- Schema migration

Suggested location:

```text
src/data/
```

The rest of the application should access storage through repository interfaces.

Example:

```ts
export interface DiagramRepository {
  findAll(): Promise<DiagramSummary[]>;
  findById(id: string): Promise<DiagramDocument | null>;
  save(diagram: DiagramDocument): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## 6.6 Import / Export

Responsibilities:

- Serialize native diagram JSON
- Validate imported files
- Export PNG
- Export SVG

Suggested location:

```text
src/features/export/
```

---

## 6.7 Component Palette

Responsibilities:

- Generic architecture components
- Kubernetes components
- Network components
- Custom icon metadata

Suggested location:

```text
src/features/palette/
```

---

## 6.8 Command System

All user editing operations should ideally be modeled as commands.

Examples:

- AddNodeCommand
- MoveNodeCommand
- DeleteSelectionCommand
- AddEdgeCommand
- GroupElementsCommand
- ChangeStyleCommand

This helps provide reliable undo/redo.

Suggested location:

```text
src/core/commands/
```

---

# 7. Domain Model

## 7.1 DiagramDocument

```ts
export interface DiagramDocument {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  viewport: DiagramViewport;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  settings: DiagramSettings;
}
```

---

## 7.2 DiagramViewport

```ts
export interface DiagramViewport {
  x: number;
  y: number;
  zoom: number;
}
```

---

## 7.3 DiagramNode

```ts
export interface DiagramNode {
  id: string;
  type: DiagramNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  groupId?: string;
  label?: string;
  style: NodeStyle;
  data?: Record<string, unknown>;
}
```

---

## 7.4 DiagramNodeType

```ts
export type DiagramNodeType =
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'diamond'
  | 'text'
  | 'image'
  | 'freehand'
  | 'architectureIcon';
```

---

## 7.5 DiagramEdge

```ts
export interface DiagramEdge {
  id: string;
  sourceNodeId?: string;
  sourceHandle?: string;
  targetNodeId?: string;
  targetHandle?: string;
  type: 'straight' | 'elbow' | 'curved';
  label?: string;
  startArrow?: ArrowHeadType;
  endArrow?: ArrowHeadType;
  style: EdgeStyle;
}
```

---

## 7.6 NodeStyle

```ts
export interface NodeStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
}
```

---

## 7.7 DiagramGroup

```ts
export interface DiagramGroup {
  id: string;
  name?: string;
  childElementIds: string[];
}
```

---

# 8. Data Storage Model

Use IndexedDB through Dexie.

## Tables

### diagrams

```text
id
name
createdAt
updatedAt
document
```

The `document` field contains the full DiagramDocument JSON object.

### preferences

```text
key
value
```

Potential preferences:

- Theme
- Grid enabled
- Snap enabled
- Default stroke color
- Default fill color
- Last opened diagram

---

# 9. Autosave Strategy

Autosave should happen automatically.

Recommended behavior:

1. User changes diagram.
2. State becomes dirty.
3. Debounce save for 500–1000 ms.
4. Persist current DiagramDocument to IndexedDB.
5. Update `updatedAt`.
6. UI shows `Saved` status.

Do not write to IndexedDB for every mouse-move event.

Example:

```text
Canvas change
    |
    v
Update Zustand state
    |
    v
Mark document dirty
    |
    v
Debounced save
    |
    v
DiagramRepository.save()
    |
    v
IndexedDB
```

---

# 10. State Management

Use Zustand.

Separate stores by responsibility.

## diagramStore

Contains:

- Current diagram
- Nodes
- Edges
- Groups
- Selection
- Dirty state

## uiStore

Contains:

- Active tool
- Sidebar state
- Properties panel state
- Grid enabled
- Snap enabled

## historyStore

Contains:

- Undo stack
- Redo stack

## libraryStore

Contains:

- Diagram summaries
- Search/filter state

Do not place all application state inside a single store.

---

# 11. Workspace Layout

Recommended layout:

```text
+------------------------------------------------------------------+
| Logo | File | Edit | View                      Diagram Name       |
+------------------------------------------------------------------+
|          |                                          |             |
| Toolbar  |                                          | Properties  |
|          |                                          |             |
| Select   |                                          | Position    |
| Rectangle|                                          | Size        |
| Circle   |              Infinite Canvas             | Style       |
| Diamond  |                                          | Text        |
| Arrow    |                                          | Layer       |
| Text     |                                          |             |
| Pen      |                                          |             |
| Icons    |                                          |             |
|          |                                          |             |
+------------------------------------------------------------------+
| Zoom | Grid | Snap | Selection Count | Saved                      |
+------------------------------------------------------------------+
```

---

# 12. Keyboard Shortcuts

Recommended initial shortcuts:

| Shortcut | Action |
|---|---|
| V | Select |
| R | Rectangle |
| O | Ellipse |
| D | Diamond |
| A | Arrow |
| T | Text |
| P | Pencil |
| Delete / Backspace | Delete selected |
| Cmd/Ctrl + C | Copy |
| Cmd/Ctrl + V | Paste |
| Cmd/Ctrl + D | Duplicate |
| Cmd/Ctrl + A | Select all |
| Cmd/Ctrl + Z | Undo |
| Cmd/Ctrl + Shift + Z | Redo |
| Cmd/Ctrl + G | Group |
| Cmd/Ctrl + Shift + G | Ungroup |
| Cmd/Ctrl + 0 | Reset zoom |
| Cmd/Ctrl + + | Zoom in |
| Cmd/Ctrl + - | Zoom out |
| Space + Drag | Pan |

Keyboard shortcuts should be handled through a central shortcut registry.

---

# 13. Folder Structure

Recommended structure:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── error-boundary.tsx
│
├── core/
│   ├── commands/
│   ├── events/
│   ├── geometry/
│   ├── ids/
│   └── utils/
│
├── domain/
│   ├── diagram.ts
│   ├── node.ts
│   ├── edge.ts
│   ├── group.ts
│   └── styles.ts
│
├── data/
│   ├── db/
│   │   ├── dexie.ts
│   │   └── migrations.ts
│   ├── repositories/
│   │   ├── diagram-repository.ts
│   │   └── indexeddb-diagram-repository.ts
│   └── autosave/
│
├── features/
│   ├── workspace/
│   │   ├── WorkspacePage.tsx
│   │   ├── Toolbar.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── StatusBar.tsx
│   │
│   ├── diagram/
│   │   ├── DiagramCanvas.tsx
│   │   ├── nodes/
│   │   ├── edges/
│   │   ├── selection/
│   │   ├── grouping/
│   │   └── hooks/
│   │
│   ├── library/
│   │   ├── DiagramLibraryPage.tsx
│   │   ├── DiagramCard.tsx
│   │   └── diagram-library-store.ts
│   │
│   ├── palette/
│   │   ├── Palette.tsx
│   │   ├── icons/
│   │   └── palette-registry.ts
│   │
│   ├── history/
│   │   └── history-store.ts
│   │
│   └── export/
│       ├── export-json.ts
│       ├── import-json.ts
│       ├── export-png.ts
│       └── export-svg.ts
│
├── stores/
│   ├── diagram-store.ts
│   ├── ui-store.ts
│   └── preferences-store.ts
│
├── components/
│   └── ui/
│
├── styles/
│   └── globals.css
│
└── main.tsx
```

---

# 14. Native File Format

Use a JSON-based project format.

Suggested extension:

```text
.diagram.json
```

Example:

```json
{
  "format": "diagram-studio",
  "formatVersion": 1,
  "document": {
    "id": "7fb2817e",
    "title": "Payment Platform Architecture",
    "version": 1,
    "createdAt": "2026-08-28T10:00:00Z",
    "updatedAt": "2026-08-28T10:10:00Z",
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    },
    "nodes": [],
    "edges": [],
    "groups": [],
    "settings": {
      "gridEnabled": false,
      "snapEnabled": false
    }
  }
}
```

Every imported file must validate:

- `format`
- `formatVersion`
- required document fields

Unknown newer versions should fail safely with a user-friendly message.

---

# 15. Undo / Redo Architecture

Undo and redo should be implemented early rather than added later.

Recommended approach:

Use a command pattern or snapshot-based history.

For V1, a bounded snapshot history is acceptable.

Example:

```text
Maximum history entries: 100
```

Do not create a history entry for every pixel of a drag.

Create one history entry when a completed user operation occurs.

Examples:

- Node created
- Node moved
- Node resized
- Style changed
- Edge created
- Group created
- Selection deleted

---

# 16. Selection Model

Selection should support:

- Single click selection
- Shift-click multi-selection
- Drag marquee selection
- Select all
- Grouped selection

The selection state should store IDs only.

Example:

```ts
interface SelectionState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}
```

---

# 17. Connector Architecture

Connectors are a core feature.

Each node should expose connection handles.

Recommended handles:

```text
Top
Right
Bottom
Left
```

Later versions can support dynamic anchor points.

When a node moves:

- The edge endpoint must remain attached.
- The edge path should be recalculated.

When a node is deleted:

- Connected edges should also be deleted or detached according to a single consistent policy.

Recommended V1 behavior:

> Delete attached edges when the connected node is deleted.

---

# 18. Architecture Icon Registry

Architecture icons should be metadata-driven.

Example:

```ts
export interface PaletteItem {
  id: string;
  category: string;
  label: string;
  icon: React.ComponentType;
  defaultWidth: number;
  defaultHeight: number;
  nodeType: DiagramNodeType;
}
```

Example categories:

```text
General
Compute
Network
Data
Messaging
Kubernetes
Storage
```

Avoid hardcoding palette items directly inside UI components.

---

# 19. Error Handling

The application should handle these cases gracefully:

- IndexedDB unavailable
- Imported file invalid
- Unsupported file version
- PNG export failure
- SVG export failure
- Corrupt stored diagram

Use centralized error notifications.

Do not allow a single corrupt diagram to make the entire diagram library unusable.

---

# 20. Performance Guidelines

The V1 editor should remain smooth with at least:

- 500 nodes
- 500 edges

Target:

- Smooth drag operations
- Smooth zooming
- No IndexedDB writes during continuous pointer movement

Use memoization for custom node components.

Avoid global React rerenders for every mouse move.

---

# 21. Security Considerations

Even though V1 is local-only:

- Sanitize imported text where required.
- Never execute content from imported JSON.
- Validate image types.
- Limit imported file size.
- Do not deserialize functions or arbitrary scripts.

Suggested import size limit:

```text
20 MB
```

---

# 22. Testing Strategy

## Unit Tests

Test:

- Diagram serialization
- Diagram deserialization
- Import validation
- Repository functions
- History operations
- Command operations
- Geometry helpers

## Component Tests

Test:

- Toolbar
- Properties panel
- Diagram cards
- Palette
- Shortcut behavior

## End-to-End Tests

Use Playwright.

Critical flows:

1. Create a diagram.
2. Add two shapes.
3. Connect them.
4. Move one shape.
5. Verify edge remains attached.
6. Change shape styling.
7. Reload page.
8. Verify diagram persisted.
9. Export JSON.
10. Import JSON.
11. Verify restored diagram.

---

# 23. Development Phases

## Phase 0 — Project Setup

Deliverables:

- React + TypeScript + Vite
- Tailwind
- Zustand
- React Flow
- Dexie
- ESLint
- Prettier
- Vitest
- Playwright

Acceptance criteria:

- App builds successfully.
- Tests run successfully.
- Empty workspace page loads.

---

## Phase 1 — Basic Canvas

Deliverables:

- Infinite canvas
- Pan
- Zoom
- Select tool
- Rectangle
- Ellipse
- Diamond
- Text

Acceptance criteria:

- User can create and move shapes.
- User can resize shapes.
- User can select and delete shapes.

---

## Phase 2 — Connectors

Deliverables:

- Node connection handles
- Straight arrows
- Arrow endpoints
- Edge labels

Acceptance criteria:

- User can connect two shapes.
- Moving either shape keeps connector attached.

---

## Phase 3 — Editing and Styling

Deliverables:

- Stroke color
- Fill color
- Stroke width
- Opacity
- Text formatting
- Duplicate
- Layer ordering

Acceptance criteria:

- Property changes update selected elements immediately.

---

## Phase 4 — Undo / Redo

Deliverables:

- Undo
- Redo
- Command history

Acceptance criteria:

- At least the previous 100 completed edit actions can be undone/redone where applicable.

---

## Phase 5 — Persistence

Deliverables:

- Dexie database
- Diagram repository
- Autosave
- Diagram library
- Rename
- Duplicate
- Delete

Acceptance criteria:

- Diagrams survive browser refresh and application restart.

---

## Phase 6 — Import / Export

Deliverables:

- Export native JSON
- Import native JSON
- PNG export
- SVG export

Acceptance criteria:

- Exported native file can be imported without losing supported diagram information.

---

## Phase 7 — Grouping and Multi-Select

Deliverables:

- Multi-select
- Marquee selection
- Group
- Ungroup
- Move grouped elements

Acceptance criteria:

- Grouped elements behave as one during selection and movement.

---

## Phase 8 — Architecture Palette

Deliverables:

- Generic architecture icons
- Kubernetes icons
- Drag/drop from palette

Acceptance criteria:

- Architecture icons behave as normal nodes and support connectors.

---

## Phase 9 — Freehand Drawing

Deliverables:

- Pencil tool
- Freehand strokes
- Stroke color
- Stroke width

Acceptance criteria:

- User can create, select, move, and delete freehand elements.

---

## Phase 10 — Polish

Deliverables:

- Keyboard shortcut registry
- Grid
- Snap
- Fit to screen
- Better error handling
- Improved performance
- UI polish

---

# 24. Initial Coding Priorities

The coding assistant should implement in this order:

1. Project skeleton
2. Domain model
3. Diagram workspace layout
4. React Flow canvas
5. Custom node components
6. Add/delete/select operations
7. Edge creation
8. Zustand diagram state
9. Undo/redo
10. IndexedDB repository
11. Autosave
12. Diagram library
13. Styling panel
14. Import/export
15. Grouping
16. Architecture palette
17. Freehand support
18. Testing and polish

Do not begin with advanced visual polish before the core diagram model, persistence, and editing behavior work reliably.

---

# 25. Suggested Routes

```text
/
    Redirect to /diagrams

/diagrams
    Diagram library

/diagrams/new
    Create diagram and redirect to editor

/diagrams/:diagramId
    Diagram workspace
```

---

# 26. UI Component Boundaries

Recommended component structure:

```text
WorkspacePage
├── TopMenu
├── ToolPalette
├── DiagramCanvas
│   ├── DiagramNode
│   ├── DiagramEdge
│   └── SelectionOverlay
├── PropertiesPanel
└── StatusBar
```

Keep business logic outside presentational components where possible.

---

# 27. Repository Abstraction

Even though V1 uses IndexedDB, storage should be abstracted.

Example:

```ts
export interface DiagramRepository {
  list(): Promise<DiagramSummary[]>;
  get(id: string): Promise<DiagramDocument | null>;
  create(diagram: DiagramDocument): Promise<void>;
  update(diagram: DiagramDocument): Promise<void>;
  delete(id: string): Promise<void>;
}
```

This will allow future implementations such as:

```text
IndexedDbDiagramRepository
FileSystemDiagramRepository
CloudDiagramRepository
```

without changing editor business logic.

---

# 28. Future Architecture — Not for V1

The architecture should permit, but not implement yet:

```text
React App
    |
    +---- Local IndexedDB
    |
    +---- Optional future API
              |
              v
         Spring Boot
              |
              v
          PostgreSQL
```

Possible future capabilities:

- User accounts
- Cloud synchronization
- Version history
- Shared diagrams
- Team libraries
- Server-side backups
- Reusable company templates
- Custom icon libraries

Do not introduce the backend until one of these requirements becomes necessary.

---

# 29. Definition of Done for V1

Version 1 is complete when a user can:

1. Open Diagram Studio.
2. Create a new diagram.
3. Add standard shapes.
4. Add text.
5. Add architecture nodes.
6. Connect nodes using arrows.
7. Move and resize nodes while keeping connectors attached.
8. Change basic styling.
9. Select multiple elements.
10. Group and ungroup elements.
11. Undo and redo changes.
12. Close/reload the application without losing the diagram.
13. Browse existing diagrams.
14. Rename, duplicate, and delete diagrams.
15. Export a diagram as PNG.
16. Export a diagram as SVG.
17. Export a native diagram JSON file.
18. Import a native diagram JSON file.
19. Use the main editor without internet access after the app is loaded/installed appropriately.

---

# 30. Key Architecture Decisions

## Decision 1

**Frontend-only V1.**

Reason:

A backend adds unnecessary complexity for a single-user local tool.

---

## Decision 2

**React Flow as the structured diagram engine.**

Reason:

The primary use case is technical architecture and flow diagrams with connected nodes.

---

## Decision 3

**IndexedDB via Dexie for persistence.**

Reason:

More scalable and reliable than localStorage for structured diagram documents.

---

## Decision 4

**JSON as the native document format.**

Reason:

Easy to version, validate, migrate, inspect, import, and export.

---

## Decision 5

**Repository abstraction around persistence.**

Reason:

Future cloud storage should not require rewriting editor logic.

---

## Decision 6

**Undo/redo designed early.**

Reason:

Retrofitting reliable history into a drawing editor is significantly harder later.

---

## Decision 7

**No AI.**

AI-related modules, APIs, dependencies, prompts, models, or placeholders should not be added.

---

# 31. Coding Assistant Instructions

When implementing this project:

1. Keep TypeScript strict mode enabled.
2. Do not use `any` unless unavoidable and documented.
3. Keep domain models independent from React components.
4. Keep IndexedDB access behind repository interfaces.
5. Keep React Flow-specific types from leaking into persistence models wherever practical.
6. Persist application domain objects, not library-internal transient objects.
7. Add schema versioning from the beginning.
8. Write tests for serialization and persistence before adding advanced features.
9. Avoid premature backend development.
10. Avoid premature optimization.
11. Do not add AI capabilities.
12. Prefer small reusable components.
13. Prefer feature-based code organization.
14. Ensure keyboard shortcuts do not trigger while typing inside text fields.
15. Debounce autosave.
16. Ensure undo/redo captures completed operations rather than every pointer event.
17. Validate all imported JSON.
18. Keep exported files backward-compatible where possible.
19. Add migration functions whenever the native format version changes.
20. Keep the application fully usable as a local personal productivity tool.

---

# 32. Recommended First Milestone

The first usable milestone should be intentionally small.

Build a page where the user can:

```text
Create diagram
    ↓
Open canvas
    ↓
Add rectangle
    ↓
Add second rectangle
    ↓
Connect rectangles
    ↓
Move rectangles
    ↓
Connector remains attached
    ↓
Refresh browser
    ↓
Diagram is restored
```

Do not add architecture icons, freehand drawing, PNG export, or advanced styling until this complete vertical slice works.

This vertical slice validates the most important architectural choices:

- Canvas engine
- Domain model
- State management
- Edge behavior
- Persistence
- Autosave

---

# 33. Final Target

Diagram Studio V1 should feel like a lightweight personal technical whiteboard:

```text
Excalidraw simplicity
        +
Structured architecture nodes
        +
Reliable connectors
        +
Local-first persistence
        +
Portable JSON / PNG / SVG files
```

The priority is **daily usability, speed, and reliability**, not feature parity with large collaborative whiteboard products.
