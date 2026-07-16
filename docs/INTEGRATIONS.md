# Integration & Backward-Compatibility Contract

From **v1.0.0** onward, the surfaces below are a **public contract**. Integrations
(scripts, importers/exporters, other services) may depend on them, and we commit
to backward compatibility under [Semantic Versioning](https://semver.org/):

- **Patch / minor** releases are **backward compatible** — fields and endpoints
  are only **added**, never removed or repurposed. Unknown fields must be ignored
  by consumers (and are preserved by the app).
- **Breaking** changes bump the **major** version and are introduced additively
  (e.g. a new versioned path or field) with a documented migration and, where
  practical, a deprecation period.

This file is the source of truth for what "stable" means. Anything not listed
here (internal component props, file layout, CSS, the in‑memory dev repository)
is **not** part of the contract and may change at any time.

---

## 1. Flow JSON (the core data model)

A **flow** is the unit integrations read/write. Shape (stable keys):

```jsonc
{
  "id": "uuid",                 // stable identifier
  "name": "string",
  "owner": "string",            // user id (API mode) or "local"
  "versions": {
    "current": <VersionChain>,
    "target":  <VersionChain>,
    "ideal":   <VersionChain>
  },
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

`VersionChain`:
```jsonc
{
  "processes":  [ <Process> ],
  "connectors": [ <Connector> ],
  "timeline":   [ { "id": "uuid", "label": "string" } ],   // columns, left→right
  "lanes":      [ { "id": "uuid", "label": "string", "height": 160 } ]
}
```

`Process`:
```jsonc
{
  "id": 1, "refNum": "P01", "name": "string",
  "type": "rectangle" | "diamond" | "customer"        // standard shapes
        | "inventory" | "kaizen" | "data-box"         // VSM shapes (added v1.1)
        | "shipment" | "operator" | "store"           // VSM shapes (added v1.1)
        | "factory" | "end-user" | "computer"         // added v1.1
        | "server" | "printer",
  "stdTime": 60,  "stdTimeUnit":  "s|min|hr|day|wk|mo",
  "idealTime": 30,"idealTimeUnit":"s|min|hr|day|wk|mo",
  "stdRes": 3, "idealRes": 2,
  "abnormal": false,            // kept in sync with abnormalityType (= type!=="none")
  "abnormalityType": "none" | "excess" | "shortage",  // Excess/Shortage Stagnation
  "laneId": "uuid|null",        // tag only (does not control position)
  "x": 84, "y": 220             // persisted model-space position
}
```

`Connector`:
```jsonc
{
  "id": 1, "refNum": "C01", "source": 1, "target": 2,   // source/target = Process.id
  "type": "process-flow" | "information-flow",
  "modeOfConveyance": "Email|API|Manual Handoff|Physical Transport|Database Sync|Meeting|Conveyor|Other",
  "stdTime": 15, "stdTimeUnit": "min", "idealTime": 5, "idealTimeUnit": "min",
  "stdRes": 2, "idealRes": 1,
  "abnormal": false,            // kept in sync with abnormalityType (= type!=="none")
  "abnormalityType": "none" | "excess" | "shortage",  // Excess/Shortage Stagnation
  "srcSide": "auto|top|bottom|left|right",
  "tgtSide": "auto|top|bottom|left|right"
}
```

**Guarantees**
- `refNum` is a display label and is renumbered on delete; use `id` for
  references. Connector `source`/`target` reference `Process.id`.
- Older documents are upgraded on read (missing keys are backfilled with safe
  defaults; legacy `v1` chains and legacy lane `rows`/`laneRow` are migrated).
  A consumer written against this schema can read any earlier flow.
- New optional fields may be added in minor releases; ignore unknown keys.
- `abnormalityType` (`none|excess|shortage`) supersedes the boolean `abnormal`,
  which is retained and kept in sync. Legacy `abnormal:true` (no type) upgrades to
  `"excess"` on read. Treat an unknown type as `"none"`.
- `type` values are stable identifiers; new shapes are **added** (never renamed
  or removed) in minor releases. Treat an unrecognized `type` as a plain
  rectangle so older consumers keep rendering newer flows.

## 2. REST API (API mode)

Base: `${VITE_API_URL}` (the server). All requests use the session **cookie**
(`credentials: 'include'`). All `/api/flows*` require authentication.

| Method & path | Purpose |
| --- | --- |
| `GET /api/health` | `{ ok, storage, auth }` |
| `GET /api/auth/config` | `{ provider, kind }` (public) |
| `POST /api/auth/login` | direct providers → sets session, returns `{ user }` |
| `GET /api/auth/login` | redirect providers (Entra) → 302 to the IdP |
| `GET /api/auth/callback` | OIDC callback → sets session, redirects to the app |
| `POST /api/auth/logout` | clears the session |
| `GET /api/auth/me` | `{ user }` or `401` |
| `GET /api/flows` | list the caller's flows (most‑recent first) |
| `GET /api/flows/:id` | one flow, or `404` |
| `POST /api/flows` | create/replace (body = flow JSON) |
| `PUT /api/flows/:id` | replace by id |
| `DELETE /api/flows/:id` | delete (`204`) |

Flows are **owner‑scoped**: the server sets `owner` to the authenticated user;
callers only ever see their own flows. Request/response bodies are the Flow JSON
in §1.

**Guarantees**
- These paths, methods, status codes, and the cookie‑session mechanism are
  stable within a major version. Additional endpoints/fields may appear.
- A future breaking API revision would be introduced under a new path (e.g.
  `/api/v2/...`) with `/api` kept working through a deprecation window.

## 3. Storage shapes

- **localStorage** — flows under key `vcm.flows.v2` as `{ [id]: flow }`. Legacy
  `vcm.flows.v1` is migrated on first read.
- **MongoDB** — one document per flow: `{ id, owner, updatedAt, data }` where
  `data` is the Flow JSON (§1). Unique on `(owner, id)`.

## 4. Auth providers

Selected by `AUTH_PROVIDER` (`sample` | `entra`). Providers implement a small
interface (`server/auth/provider.js`); the **session cookie shape is identical**
across providers, so swapping providers does not affect the API contract.

---

**Changing the contract?** Update this document in the same PR, add a `CHANGELOG`
entry, and follow the SemVer rules above.
