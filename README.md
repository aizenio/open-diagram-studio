# Diagram Studio

Diagram Studio is a local-first diagram editor that runs entirely in your browser. Draw flowcharts and technical diagrams without an account, backend, or cloud storage.

## Features

- Infinite canvas with panning and zoom from 5% to 800%
- Rectangle, rounded rectangle, ellipse, diamond, text, and arrow tools
- Drag to draw and resize shapes
- Inline text editing
- Connectors that remain attached when nodes move
- Single and multi-node selection, movement, and deletion
- Node label, fill, stroke, and stroke-width controls
- Collapsible properties panel
- Automatic browser storage with IndexedDB
- JSON backup and PNG export

## Requirements

- [Node.js](https://nodejs.org/) 22 or newer
- npm 10 or newer
- A current version of Chrome, Edge, Firefox, or Safari

## Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/malu80/open-diagram-studio.git
cd open-diagram-studio
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`.

## Production Build

Create and preview an optimized production build:

```bash
npm run build
npm run start
```

The production preview is available at `http://127.0.0.1:4173`.

## Usage

1. Choose a shape from the left toolbar and drag on the canvas.
2. Double-click empty canvas space to create text, or choose the Text tool.
3. Double-click a node label to edit it.
4. Select the Arrow tool, then connect node handles.
5. Select a node to resize it or edit its appearance in the properties panel.
6. Use Shift-click or drag a selection area to select multiple nodes.

### Canvas Controls

- Mouse wheel or trackpad: zoom
- Middle-click, right-click, or Space-drag: pan
- `Cmd/Ctrl` + `+` or `-`: zoom in or out
- `Cmd/Ctrl` + `0`: reset to 100%
- Arrow keys: move selected nodes by 10 pixels
- Delete or Backspace: remove the selection
- Escape: cancel the active drawing or connector tool

## Local Data and Backups

Diagram Studio stores the current diagram in IndexedDB. Data stays in the browser profile associated with the exact hostname and port you use.

Use **JSON** in the top bar to create a portable backup. Clearing browser site data removes the locally stored diagram. JSON import is not currently implemented.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run Oxlint |
| `npm test` | Run the automated test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests and generate a coverage report |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build with Vite defaults |
| `npm run start` | Preview at `127.0.0.1:4173` |

## Technology

- React and TypeScript
- Vite
- React Flow
- Zustand
- Dexie and IndexedDB
- Lucide icons
- html-to-image

## Project Structure

```text
src/
	data/                 IndexedDB persistence
	domain/               Framework-independent diagram models
	features/diagram/     Canvas nodes and edge rendering
	stores/               Zustand state and diagram actions
	App.tsx                Editor shell and interactions
	App.css                Editor and canvas styling
```

## Contributing

Contributions are welcome.

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm install`.
3. Make a small, scoped change consistent with the existing architecture.
4. Run `npm test`, `npm run lint`, and `npm run build`.
5. Open a pull request explaining the behavior changed and how it was tested.

For bug reports, include reproduction steps, expected behavior, actual behavior, browser details, and screenshots when useful. Please do not include unrelated formatting or refactoring in the same pull request.

## License

Diagram Studio is available under the [MIT License](LICENSE).
