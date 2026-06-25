# VSM Studio — Value Stream Mapping Tool

An intuitive, browser-based **Value Stream Mapping** tool for analyzing end-to-end
process lead time. Drag-and-drop editing, formal VSM notation, live lead-time
calculations, current-vs-future state comparison, and image/PDF/JSON export.

This is a working prototype — no backend, accounts, or database. All state lives
in memory (React + Zustand). Use **Save / Load JSON** to persist a map to a file.

## Tech stack

- **Vite + React + TypeScript**
- **React Flow** (`@xyflow/react`) — drag-and-drop canvas, custom nodes & edges
- **Tailwind CSS** — styling
- **html-to-image + jsPDF** — PNG / PDF export
- **Zustand + zundo** — in-memory state with undo/redo

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Features

### Canvas
- Infinite pan/zoom canvas with **snap-to-grid** (horizontal & vertical) for tidy,
  readable layouts, fit-to-view, and a minimap.
- Drag stencils from the palette; nodes are connectable, movable, and resizable.
- Select / multi-select (Shift), copy/paste, duplicate, delete, undo/redo.

### Formal VSM notation
- **Process Box** with an editable Data Box (C/T, C/O, Uptime %, Operators,
  Batch Size, Shifts).
- **Inventory triangle (I)** — the primary stagnation indicator (quantity + wait time).
- Supermarket, FIFO lane, Safety/Buffer stock.
- Customer, Supplier, Production Control entities, and a Shipment/truck icon.
- Flow arrows: **Push** (striped), **Pull**, **Manual info** (straight),
  **Electronic info** (zigzag). Pick the line type in the top bar before connecting.
- **Kaizen burst** for future-state improvements and free-text **sticky notes**.

Double-click a node to rename it inline; select it to edit all data fields in the
right-hand **Inspector**.

### Time-unit control & live calculations
- Global time-unit selector (Seconds → Months). All time values are stored
  canonically in **seconds** and converted for display, so switching units never
  loses data.
- A **lead-time ladder** along the bottom auto-derives from the flow: lower rungs
  are Value-Added (process cycle times), upper rungs are Non-Value-Added
  (inventory wait times), ordered left-to-right by position.
- Live metrics: **Total Lead Time, VA Time, NVA Time, VA Ratio (PCE),** process
  step count, and inventory/stagnation count.

### Current vs Future comparison
- Multiple named **states** (tabs). **Duplicate as future** clones the current map.
- **Compare states** shows two maps side-by-side with a metrics **delta table**
  (absolute + % improvement, color-coded).

### Export
- **PNG** and **PDF** (fits the map to the page and appends a metrics summary).
- **Save / Load JSON** for the full multi-state project.

## Keyboard shortcuts

| Action     | Shortcut                            |
| ---------- | ----------------------------------- |
| Delete     | `Del` / `Backspace`                 |
| Undo       | `Ctrl/Cmd + Z`                      |
| Redo       | `Ctrl/Cmd + Shift + Z` / `Ctrl + Y` |
| Duplicate  | `Ctrl/Cmd + D`                      |
| Copy/Paste | `Ctrl/Cmd + C` / `V`                |

Click **Load sample** in the top bar to explore a ready-made example value stream.
