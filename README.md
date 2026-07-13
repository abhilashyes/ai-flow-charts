# Value Chain Mapper

Create, visualize, and analyze **Material & Information Flow charts (Value
Chains)**. Enter structured process and connector data on the left; an
interactive diagram updates in real time on the right. Model a **Standard**
(as-is) and an **Ideal** (to-be) chain and compare them side by side.

> **Phase 1 — mock UI.** All state lives in memory (React). No backend yet;
> sample data is pre-loaded. Backend/persistence/export come in later phases.

## Tech stack
- **React 18** + **Vite** (used instead of the deprecated create-react-app)
- **Tailwind CSS** for styling
- **Cytoscape.js** for the interactive diagram
- **lucide-react** icons

## Getting started
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the build
```

## Features (Phase 1)
- **25 / 75 resizable layout** — drag the divider between the input panel and the
  diagram.
- **Processes tab** — add process boxes (rectangle = task, diamond = decision)
  with standard/ideal time and resources; reference numbers (`P01`, `P02`…)
  auto-generate.
- **Connectors tab** — link two processes with a Process Flow (solid) or
  Information Flow (dashed) edge, a mode of conveyance, and times/resources.
  Dropdowns show `RefNum — Name`.
- **Live Cytoscape diagram** — rectangles/diamonds, solid/dashed edges, labels
  below each node and on each edge; scroll to zoom, drag to pan, click to select
  (selection is highlighted in the list and on the diagram).
- **Modes** — Standard / Ideal / **Comparison** (two diagrams side by side with
  per-side step counts and process time).
- **Validation** — inline field errors (name required, times/resources > 0,
  source ≠ target, both processes exist).
- **Cascade delete** — deleting a process removes connectors that reference it.
- **Undo / Redo** — via the Settings tab or `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`.
- **Toasts** — success/info feedback, auto-dismiss after 3s.

## Project structure
```
src/
  App.jsx                     root state wiring + keyboard shortcuts
  hooks/useValueChain.js      processes, connectors, mode, undo/redo, toasts
  utils/                      constants, ref-number gen, validation, sample data
  components/
    Header.jsx  MainLayout.jsx  Toast.jsx  formControls.jsx
    left/       tabs, forms (Process/Connector), lists
    right/      InteractiveDiagram (Cytoscape), ComparisonView, RightPanel
```

## Roadmap (later phases)
Backend API + persistence, authentication, save/load, PDF/PNG export,
click-diagram-to-edit, and responsive/mobile polish.
