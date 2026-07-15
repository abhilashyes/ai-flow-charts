# Setup & Deployment

Value Chain Mapper is a React client with an optional Node/Express + MongoDB
backend. It runs in two modes, chosen entirely by configuration:

| Mode | Storage | Auth | When |
| --- | --- | --- | --- |
| **Local** (default) | browser `localStorage` | none | Static demo (GitHub Pages), quick local dev |
| **API** | MongoDB via the server | login required | Self-hosted / org deployment |

The mode is selected by the client env var **`VITE_API_URL`**: unset → Local,
set → API.

---

## 1. Quick start with Docker (recommended for an org)

Brings up MongoDB + the app (the server serves the built client and the API) in
one command:

```bash
# from the repo root
JWT_SECRET="$(openssl rand -hex 32)" docker compose up --build
```

Open http://localhost:4000 → "Sign in (demo)" → start mapping. Flows are stored
in MongoDB (persisted in the `mongo-data` volume).

Set a stable `JWT_SECRET` (any long random string) for real deployments; put it
in a `.env` file next to `docker-compose.yml` or your orchestrator's secrets.

## 2. Local development (two processes)

```bash
# 1) API server (in-memory store if MONGODB_URI is unset)
cd server
cp .env.example .env        # optional; set MONGODB_URI to use a real Mongo
npm install
npm run dev                 # http://localhost:4000

# 2) client (in another terminal, from the repo root)
cp .env.example .env.local
#   then set:  VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

Without `VITE_API_URL`, `npm run dev` runs the pure localStorage demo — no server
needed.

## 3. Environment variables

**Client** (`.env` / `.env.local`, see `.env.example`)
- `VITE_API_URL` — base URL of the API server. Unset = Local mode.

**Server** (`server/.env`, see `server/.env.example`)
- `PORT` (default 4000)
- `MONGODB_URI` — Mongo connection string. Unset = in-memory repository (not
  persisted; handy for a quick look or tests).
- `JWT_SECRET` — signs session cookies; **required** in production.
- `AUTH_PROVIDER` — `sample` (default) or `entra`.
- `CLIENT_ORIGIN` — comma-separated allowed origins for CORS in split dev.

---

## 4. Architecture (where to extend)

- **Storage seam** — `src/utils/store.js` picks a backend by `VITE_API_URL`:
  `storeLocal.js` (localStorage) or `storeApi.js` (REST). Both expose the same
  async API, so consumers (`App.jsx`, `useFlows.js`, `useFlowEditor.js`) are
  backend-agnostic.
- **Repository interface** — `server/repositories/flowRepository.js` defines
  `list/get/upsert/remove` (owner-scoped). Two implementations ship: `Mongo…`
  (used when `MONGODB_URI` is set) and an in-memory one. Swap in another database
  by implementing the same four methods.
- **Auth providers** — `server/auth/` has a provider seam. `sampleProvider.js`
  (active) does demo sign-in; `entraProvider.js` is the Entra stub. Sessions are
  a signed JWT in an httpOnly cookie (`server/auth/session.js`).

## 5. Wiring Microsoft Entra later

The Entra provider is intentionally a **stub** so the seam, env vars, and
cookie-session shape are already in place — enabling it is additive, not a
refactor. To turn it on:

1. Register an application in the **Microsoft Entra admin center**. Note the
   tenant ID, client ID, and a client secret. Add a redirect URI
   (e.g. `https://your-host/api/auth/callback`).
2. Set in `server/.env`:
   ```
   AUTH_PROVIDER=entra
   ENTRA_TENANT_ID=...
   ENTRA_CLIENT_ID=...
   ENTRA_CLIENT_SECRET=...
   ENTRA_REDIRECT_URI=https://your-host/api/auth/callback
   ```
3. Implement the OIDC authorization-code flow in
   `server/auth/entraProvider.js` (using `@azure/msal-node` or
   `passport-azure-ad`): `GET /api/auth/login` redirects to Entra; a
   `GET /api/auth/callback` route exchanges the code, validates the `id_token`,
   upserts the user, calls `issueSession(res, user)`, and redirects to the app.
   `requireAuth` and the flow routes need no changes.
4. In `src/components/LoginPage.jsx`, enable the "Sign in with Microsoft" button
   to hit `${VITE_API_URL}/api/auth/login`.

## 6. GitHub Pages

The existing Pages workflow builds the client in **Local mode** (no
`VITE_API_URL`), so the static demo keeps working on localStorage. Mongo/auth is
the self-hosted path (Docker or your own server) described above.
