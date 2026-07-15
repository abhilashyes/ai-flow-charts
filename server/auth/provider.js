/**
 * Auth provider interface.
 *
 * An auth provider turns an inbound request into an authenticated user. The
 * session cookie itself is handled centrally (see auth/session.js), so a
 * provider only needs to identify the user.
 *
 *   id: string
 *   async login(req) -> Promise<user>   // { id, name, email?, provider }
 *
 * - The `sample` provider logs in a fixed demo user with no password.
 * - The `entra` provider (stub) would instead drive an OIDC redirect/callback
 *   flow and mint the same session on success.
 *
 * Select the active provider with AUTH_PROVIDER (default: sample).
 */
export {}
