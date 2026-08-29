# Diagram Studio Design System

The visual language for Diagram Studio. Everything the app renders — chrome
and canvas objects alike — is built from the tokens and primitives described
here.

**Source:** [`src/design-system/`](../src/design-system)

```
src/design-system/
├── styles.css          # single CSS entry point (imported once in main.tsx)
├── tokens.css          # every design decision, as CSS custom properties
├── tokens.ts           # the subset of tokens JavaScript needs
├── primitives.css      # component classes, built only from tokens
├── index.ts            # public component exports
└── components/         # React primitives
```

---

## 1. Principles

**The canvas is the product.** Chrome floats above the board and stays quiet:
one accent colour, one elevation language, no decorative borders. If a pixel
is not helping someone draw, it should recede.

**Tokens, not values.** No component hardcodes a colour, radius, shadow, or
duration. If a value is missing, add the token first. This is what makes dark
mode, density changes, and theming a one-file edit.

**Semantic over raw.** Components consume `--ds-color-surface`, never
`--ds-neutral-0`. The palette is private to `tokens.css`.

**One of each thing.** One accent. One neutral ramp. One type family. One
elevation ladder. Variety comes from hierarchy, not from new ingredients.

**Legible at every zoom.** Node fills are muted enough that dark labels stay
readable, and stroke colours stay distinguishable at 25%.

**Accessible by default.** Every interactive element has a visible
`:focus-visible` ring, an accessible name, and a 32px minimum hit target.

---

## 2. Colour

### Palette (private)

Three ramps live in `tokens.css` and are referenced only by the semantic
aliases below.

| Ramp | Steps | Used for |
|---|---|---|
| `--ds-neutral-*` | `0` → `950` | Surfaces, borders, text |
| `--ds-accent-*` | `25` → `900` | Selection, primary actions, active tool |
| `--ds-success/warning/danger-*` | `50`, `100`, `500`–`700` | Save state, destructive actions |

The accent is `#4262ff` — a confident indigo-blue that reads as *tool*, not
*marketing site*, and stays distinct from every node fill swatch.

### Semantic aliases (use these)

**Surfaces**, back to front:

| Token | Role |
|---|---|
| `--ds-color-canvas` | The infinite board |
| `--ds-color-canvas-dot` | Board grid dots |
| `--ds-color-surface-sunken` | Recessed wells, segmented control tracks |
| `--ds-color-surface` | Panels, inputs |
| `--ds-color-surface-raised` | Chrome floating over the board |
| `--ds-color-surface-hover` / `-active` | Interaction states |
| `--ds-color-surface-inverse` | Tooltips |
| `--ds-color-scrim` | Modal backdrop |

**Borders:** `--ds-color-border-subtle` (panel dividers) →
`--ds-color-border` (inputs, default) → `--ds-color-border-strong`
(hover, slider thumbs).

**Text:** `--ds-color-text` → `-secondary` → `-tertiary` → `-disabled`, plus
`-inverse` and `-accent`.

`-tertiary` maps to a dedicated `--ds-neutral-550`, not to `-500`. It carries
the app's smallest type — the 11px status bar and the uppercase eyebrows — and
WCAG AA asks 4.5:1 of text at any size. `--ds-neutral-500` reaches only 3.7:1 on
a white card, so the ramp gained a step rather than collapsing tertiary into
secondary.

**Accent:** `--ds-color-accent`, `-hover`, `-active`, `-subtle`,
`-subtle-hover`, `-border`, and `--ds-color-on-accent` for text on top.

**Canvas objects:** `--ds-color-node-fill`, `-node-stroke`, `-node-text`,
`--ds-color-edge`, `--ds-color-selection`, `--ds-color-selection-fill`,
`--ds-color-handle`, `--ds-color-handle-ring`.

### Node colours are user data

`--ds-color-node-fill`, `-node-stroke` and `-node-text` are **not overridden in
the dark theme**, and `nodeDefaults` in `tokens.ts` is literal rather than
token-derived. All three are written into the saved document: if they followed
the theme, a board drawn in dark mode would come back unreadable in light mode,
and near-white labels would land on the white shapes a user had already chosen.
`--ds-color-edge`, which is never user-set, does follow the theme.

### Node swatches

Ten fills (`--ds-swatch-*`) and eight strokes, exported from `tokens.ts` as
`fillSwatches` / `strokeSwatches`. They are deliberately desaturated: every
fill carries `--ds-color-node-text` at WCAG AA, and every stroke stays
distinguishable against every fill.

### Theming

Light is the default. Dark is defined twice, on purpose:

```css
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { … } }
:root[data-theme='dark'] { … }
```

System preference applies unless the user has chosen explicitly; an explicit
choice always wins in both directions. Set `data-theme` on `<html>`.

---

## 3. Typography

One family: **Inter**, falling back to the platform UI stack. `tokens.css`
never loads a font from the network — see the plan's Phase 1 for self-hosting.

| Token | Size | Use |
|---|---|---|
| `--ds-font-size-3xs` | 11px | Status bar, metadata, `kbd` — tabular only |
| `--ds-font-size-2xs` | 12px | Field labels, captions, badges |
| `--ds-font-size-xs` | 13px | **Default control text** |
| `--ds-font-size-sm` | 14px | Body, panel titles |
| `--ds-font-size-md` | 16px | Emphasis |
| `--ds-font-size-lg` | 18px | Empty-state titles |
| `--ds-font-size-xl` / `-2xl` | 22 / 28px | Display |

Weights: 400 regular, 500 medium (controls), 600 semibold (titles), 700 bold
(rare). Line heights: `tight` 1.2, `snug` 1.35, `normal` 1.5, `relaxed` 1.65.

**Rule:** nothing below 11px, and 11px is reserved for tabular metadata.
`--ds-letter-spacing-caps` (0.06em) is mandatory on uppercase eyebrows.

---

## 4. Space, radius, elevation, motion

**Space** — a 4px grid: `--ds-space-025` (2px), `-05` (4), `-1` (8), `-15`
(12), `-2` (16), `-25` (20), `-3` (24), `-4` (32), `-5` (40), `-6` (48),
`-8` (64). Use one scale for padding, gap, and margin.

**Radius** — `xs` 4, `sm` 6, `md` 8 (controls), `lg` 12 (panels), `xl` 16,
`2xl` 20, `full`. Nested corners step down one level.

**Elevation** — every shadow is two-part (a tight contact shadow plus a wide
ambient one) so floating chrome reads as physically above the board:

| Token | Use |
|---|---|
| `--ds-shadow-xs` | Buttons at rest |
| `--ds-shadow-sm` | Hover lift |
| `--ds-shadow-md` | Tooltips, popovers |
| `--ds-shadow-lg` / `-xl` | Dialogs |
| `--ds-shadow-float` | Hairline + elevation, for chrome over the canvas |
| `--ds-shadow-focus` | The focus ring |

Dark mode redefines all of them — the light-theme shadows disappear on a dark
ground, so the dark set trades spread for opacity.

**Motion** — `instant` 80ms, `fast` 120 (hover/press), `base` 180 (panels),
`slow` 260 (tooltip delay), `slower` 400. Easings: `standard`,
`decelerate`, `accelerate`, `overshoot`. `--ds-transition-control` bundles the
five properties every control animates. All durations collapse to `0ms` under
`prefers-reduced-motion`. **Nothing on the canvas animates during a drag.**

**Layering** — one scale, `--ds-z-canvas` (0) → `-edges` → `-nodes` →
`-canvas-overlay` (4) → `-chrome` (20) → `-dropdown` (100) → `-tooltip` (200)
→ `-modal` (300) → `-toast` (400). No raw `z-index` anywhere else.

**Dimensions** — controls are 28 / 32 / 40px (`--ds-control-height-*`); icons
14 / 16 / 20px; chrome sizes are `--ds-topbar-height` (52),
`--ds-statusbar-height` (30), `--ds-toolbar-width` (56),
`--ds-inspector-width` (288).

---

## 5. Components

Import from the barrel, never from the files directly:

```tsx
import { Button, IconButton, Tooltip, Field, TextInput } from './design-system'
```

| Component | Notes |
|---|---|
| `Button` | `variant`: primary / secondary / ghost / danger. `size`: sm / md / lg. `icon`, `block`. Defaults to `type="button"`. |
| `IconButton` | Icon-only. `label` is **required** and becomes the accessible name; renders a `Tooltip` with an optional `shortcut` by default. `active` drives the accent fill for the selected tool. |
| `Tooltip` | Hover/focus, 260ms delay, four placements. Handlers sit on the wrapping anchor so any child works. Never the only source of a label. |
| `Field` | Label + control + optional hint. The only sanctioned way to label an input. |
| `TextInput` | `quiet` hides the border until hover/focus — for the inline-editable diagram title. |
| `ColorInput` | Native `<input type="color">`, restyled as a swatch. |
| `RangeInput` | Cross-browser slider. |
| `SwatchPicker` | Preset colour grid; faster than the OS picker for most edits. |
| `Panel` / `PanelHeader` / `PanelSection` | `variant="floating"` gives the hairline + shadow used over the canvas. |
| `Toolbar` / `Divider` | Floating rail of icon buttons, vertical or horizontal, with `role="toolbar"`. |
| `SegmentedControl` | Small mutually-exclusive choice (grid mode, edge style). |
| `StatusDot` | `tone` neutral / success / warning / danger, `pulse` while in flight. |
| `Badge`, `Kbd`, `EmptyState` | Feedback and copy primitives. |

CSS-only utilities also exist for layout (`ds-stack`, `ds-row`, `ds-gap-*`)
and text (`ds-eyebrow`, `ds-numeric`, `ds-truncate`, `ds-visually-hidden`).

---

## 6. Contrast

Every text/background pair the app actually renders clears 4.5:1 in **both**
themes. When you add or change a colour token, re-check it — the audit that
introduced `--ds-neutral-550` found three failures that had shipped unnoticed.

Non-text graphics (the save dot, icon-only affordances) need 3:1, but the
tokens are tuned to 4.5:1 throughout so a colour can move between roles without
a fresh audit.

## 7. Rules of use

1. **Never hardcode a value.** Add a token, then use it.
2. **Never reach past the barrel.** Import from `./design-system`.
3. **Never use a raw palette token** outside `tokens.css`.
4. **Never remove a focus ring.** Restyle it via `--ds-color-focus-ring`.
5. **Never use a raw `z-index`.** Use the layering scale.
6. **Icon-only controls always take a `label`.**
7. **Type stays at 11px or larger**, and 11px only for tabular metadata.

## 8. Extending it

Adding a component: build it from existing tokens; if you need a new one, add
it to the right section of `tokens.css` with a comment explaining the role,
not the value. Add the class to `primitives.css`, the React wrapper to
`components/`, the export to `index.ts`, and a row to the table above.
