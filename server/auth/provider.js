/**
 * Auth provider interface. The session cookie is handled centrally
 * (auth/session.js); a provider only identifies the user.
 *
 * Every provider has:
 *   id:   string
 *   kind: 'direct' | 'redirect'
 *
 * Direct providers (e.g. `sample`) authenticate in one request:
 *   async login(req) -> user            // { id, name, email?, provider }
 *
 * Redirect providers (e.g. `entra`) drive an OIDC/OAuth browser round-trip:
 *   async authUrl(req, res) -> string   // authorize URL to redirect the browser to
 *   async callback(req, res) -> user    // exchange the code, return the user
 *
 * Routes (routes/auth.js) branch on `kind`. Select the active provider with
 * AUTH_PROVIDER (default: sample).
 */
export {}
