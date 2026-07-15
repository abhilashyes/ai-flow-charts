import { ConfidentialClientApplication, CryptoProvider } from '@azure/msal-node'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { userRepository } from '../repositories/userRepository.js'

/**
 * Microsoft Entra ID (Azure AD) OIDC provider — authorization-code flow with
 * PKCE. It is a "redirect" provider: the browser is sent to Entra to sign in,
 * then back to /api/auth/callback where the code is exchanged for tokens and a
 * session cookie is minted (via auth/session.js, same as the sample provider).
 *
 * Enable with AUTH_PROVIDER=entra and the ENTRA_* env vars (see SETUP.md).
 */

const SCOPES = ['openid', 'profile', 'email']
const FLOW_COOKIE = 'vcm_auth_flow' // short-lived: carries PKCE verifier + state
const cryptoProvider = new CryptoProvider()

function requireConfig() {
  const { tenantId, clientId, clientSecret, redirectUri } = config.entra
  const missing = Object.entries({
    ENTRA_TENANT_ID: tenantId,
    ENTRA_CLIENT_ID: clientId,
    ENTRA_CLIENT_SECRET: clientSecret,
    ENTRA_REDIRECT_URI: redirectUri,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missing.length) {
    throw new Error(`Entra is not fully configured. Missing: ${missing.join(', ')}. See SETUP.md.`)
  }
}

let msalClient = null
function client() {
  requireConfig()
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.entra.clientId,
        authority: `https://login.microsoftonline.com/${config.entra.tenantId}`,
        clientSecret: config.entra.clientSecret,
      },
    })
  }
  return msalClient
}

export const entraProvider = {
  id: 'entra',
  kind: 'redirect',

  // Build the Entra authorize URL; stash the PKCE verifier + state in a signed,
  // short-lived httpOnly cookie so the callback can verify them.
  async authUrl(req, res) {
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes()
    const state = cryptoProvider.createNewGuid()
    const flowToken = jwt.sign({ verifier, state }, config.jwtSecret, { expiresIn: '10m' })
    res.cookie(FLOW_COOKIE, flowToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProd,
      maxAge: 10 * 60 * 1000,
    })
    return client().getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: config.entra.redirectUri,
      responseMode: 'query',
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      state,
    })
  },

  // Exchange the authorization code for tokens, validate state, map the id-token
  // claims to a user, and persist it.
  async callback(req, res) {
    const raw = req.cookies?.[FLOW_COOKIE]
    if (!raw) throw new Error('Missing auth flow — please sign in again.')
    let flow
    try {
      flow = jwt.verify(raw, config.jwtSecret)
    } catch {
      throw new Error('Auth flow expired — please sign in again.')
    }
    res.clearCookie(FLOW_COOKIE)

    if (req.query.error) {
      throw new Error(String(req.query.error_description || req.query.error))
    }
    if (!req.query.code) throw new Error('No authorization code returned.')
    if (req.query.state !== flow.state) throw new Error('State mismatch — possible CSRF.')

    const result = await client().acquireTokenByCode({
      code: String(req.query.code),
      scopes: SCOPES,
      redirectUri: config.entra.redirectUri,
      codeVerifier: flow.verifier,
    })

    const claims = result.idTokenClaims || result.account?.idTokenClaims || {}
    const user = {
      id: claims.oid || claims.sub || result.account?.homeAccountId,
      name: claims.name || claims.preferred_username || 'Entra User',
      email: claims.preferred_username || claims.email || '',
      provider: 'entra',
    }
    if (!user.id) throw new Error('Could not determine the user id from the token.')
    await userRepository.upsert(user)
    return user
  },
}
