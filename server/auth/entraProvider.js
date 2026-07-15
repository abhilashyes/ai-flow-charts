import { config } from '../config.js'

/**
 * STUB — Microsoft Entra ID (Azure AD) OIDC provider. Not wired up yet.
 *
 * To activate (see SETUP.md → "Wiring Microsoft Entra later"):
 *   1. Register an app in the Entra admin center; set ENTRA_TENANT_ID,
 *      ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_REDIRECT_URI, AUTH_PROVIDER=entra.
 *   2. Add `@azure/msal-node` (or `passport-azure-ad`) to server deps.
 *   3. Implement the OIDC authorization-code flow:
 *        GET  /api/auth/login    -> redirect to the Entra authorize URL
 *        GET  /api/auth/callback -> exchange the code, validate the id_token,
 *                                   upsert the user, issueSession(res, user),
 *                                   redirect back to the app.
 *   The session cookie shape stays identical, so requireAuth and the flow routes
 *   need no changes.
 */
export const entraProvider = {
  id: 'entra',
  async login() {
    void config.entra
    throw new Error(
      'Entra provider is not configured. See server/auth/entraProvider.js and SETUP.md.',
    )
  },
}
