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

## 5. Microsoft Entra (Azure AD) sign-in

Entra sign-in is **implemented** (OIDC authorization-code flow with PKCE, via
`@azure/msal-node` in `server/auth/entraProvider.js`). To turn it on you only
need to register an app and set env vars — no code changes.

**a. Register an app** in the [Microsoft Entra admin center](https://entra.microsoft.com)
(Identity → Applications → App registrations → New registration):
- Copy the **Directory (tenant) ID** and **Application (client) ID**.
- Certificates & secrets → **New client secret** → copy the secret **Value**.
- Authentication → **Add a platform → Web** → Redirect URI:
  `https://your-host/api/auth/callback` (must match `ENTRA_REDIRECT_URI` exactly).

**b. Configure** `server/.env` (or the compose `.env`):
```
AUTH_PROVIDER=entra
ENTRA_TENANT_ID=<directory-tenant-id>
ENTRA_CLIENT_ID=<application-client-id>
ENTRA_CLIENT_SECRET=<secret-value>
ENTRA_REDIRECT_URI=https://your-host/api/auth/callback
JWT_SECRET=<long-random-string>
```
With `docker compose`, these pass through from your shell / a `.env` next to
`docker-compose.yml`.

**c. That's it.** The login page then shows **Sign in with Microsoft** (the demo
button is disabled). Flow: `GET /api/auth/login` → Entra → `GET /api/auth/callback`
exchanges the code, validates the token, upserts the user, and mints the same
session cookie the rest of the app already uses. The user id is the Entra `oid`.

Notes:
- The app requests the `openid profile email` scopes (no admin consent needed).
- If the client and API are on **different sites** (not just different ports),
  set the session cookie to `SameSite=None; Secure` — see `server/auth/session.js`.
- Restrict who can sign in by configuring the app registration (single-tenant,
  assignment required, etc.) in Entra.

## 6. GitHub Pages

The existing Pages workflow builds the client in **Local mode** (no
`VITE_API_URL`), so the static demo keeps working on localStorage. Mongo/auth is
the self-hosted path (Docker or your own server) described above.
