# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project follows
[Semantic Versioning](https://semver.org/). Starting with **v1.0.0**, the public
integration surface (REST API, flow JSON, storage shapes) is a compatibility
contract — see [docs/INTEGRATIONS.md](./docs/INTEGRATIONS.md).

## [1.0.0] — 2026-07-15

First stable, integration-ready release. Value Chain Mapper models Material &
Information Flow charts, with an optional self-hostable backend.

### Highlights
- **Diagram editor** (React + Cytoscape.js): rectangle/diamond/customer shapes,
  solid **process-flow** / dashed **information-flow** connectors with per‑end
  exit/entry sides and strict 90° orthogonal routing, an **editable timeline**
  (columns add left/right), and **free, persisted shape positions** (X snaps to
  the nearest timeline column; Y is free).
- **Swim lanes** — optional, freely‑resizable visual bands (add above/below,
  rename, drag to resize).
- **Three independent versions per flow** — **Current / Target / Ideal** — each a
  self‑contained diagram; a **top/bottom compare** view and **copy‑from‑version**.
- **Per‑element metrics** — Standard & Ideal time with independent **units**
  (seconds…months), resource counts, an **abnormality** flag (🚩), and a
  per‑element **mode of conveyance** shown as an icon.
- **Continuous ref numbers** (`P01…`, `C01…`) that renumber on delete.
- **Read‑only JSON view** per version; select an element on the diagram to jump
  to its list tile; double‑click to edit.
- **Home screen** — multiple flows: create, open, rename, **duplicate**, delete.

### Backend & auth (new)
- **Pluggable storage** — the client picks a backend from `VITE_API_URL`:
  browser `localStorage` (default; the GitHub Pages demo) or a **MongoDB**‑backed
  REST API (`server/`). Same async interface either way.
- **Express + Mongoose server** with an owner‑scoped **repository interface**
  (`list/get/upsert/remove`) and two implementations (MongoDB, and in‑memory for
  zero‑dependency dev/CI).
- **Provider‑based auth** with a signed‑JWT httpOnly cookie session:
  - `sample` — demo sign‑in (no password), for dev.
  - `entra` — **Microsoft Entra ID (Azure AD)** OIDC authorization‑code flow with
    PKCE (via `@azure/msal-node`); enable with `AUTH_PROVIDER=entra` + `ENTRA_*`
    env vars. No code changes required to turn on.
- **One‑command setup** — multi‑stage `Dockerfile` + `docker-compose.yml`
  (MongoDB + app), `.env.example` files, and [SETUP.md](./SETUP.md).

### Compatibility
- Flows persisted by earlier builds are migrated forward automatically on load
  (`normalizeFlow` / legacy `v1 → v2`), so existing localStorage data keeps
  working. See [docs/INTEGRATIONS.md](./docs/INTEGRATIONS.md) for the stable
  contract and the versioning/deprecation policy that applies from here on.

[1.0.0]: https://github.com/abhilashyes/ai-flow-charts/releases/tag/v1.0.0
