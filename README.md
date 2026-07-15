# Value Chain Mapper

Create, visualize, and analyze **Material & Information Flow charts (Value
Chains)**. Enter structured process and connector data on the left; an
interactive diagram updates in real time on the right. Model a **Standard**
(as-is) and an **Ideal** (to-be) chain and compare them side by side.

Runs two ways: a **localStorage demo** (default, zero setup) or **self-hosted**
with a Node/Express + **MongoDB** backend and login. See **[SETUP.md](./SETUP.md)**
for `docker compose up`, env vars, and wiring **Microsoft Entra** sign-in.

## Tech stack
- **React 18** + **Vite** (used instead of the deprecated create-react-app)
- **Tailwind CSS** for styling
- **Cytoscape.js** for the interactive diagram
- **lucide-react** icons

## Getting started (localStorage demo)
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the build
```

## Backend, auth & deployment
For MongoDB-backed persistence and login (and an org deployment via
`docker compose`), see **[SETUP.md](./SETUP.md)**. In short: the client picks its
storage backend from `VITE_API_URL` (unset = localStorage; set = the REST API in
`server/`), and auth is provider-based: a demo sign-in for dev and a working
**Microsoft Entra** (OIDC) provider you enable with env vars
(`server/auth/entraProvider.js`).

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

## Releases & integrations
See [CHANGELOG.md](./CHANGELOG.md) for release notes. From **v1.0.0** the public
integration surface (REST API, flow JSON, storage) is a compatibility contract —
[docs/INTEGRATIONS.md](./docs/INTEGRATIONS.md).

## Roadmap
PDF/PNG export and responsive/mobile polish.
