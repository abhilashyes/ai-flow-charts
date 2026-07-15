import { Router } from 'express'
import { authProvider } from '../auth/index.js'
import { issueSession, clearSession, requireAuth } from '../auth/session.js'
import { config } from '../config.js'

const router = Router()

// Where to send the browser after a redirect-based login completes. Same-origin
// (server serves the client) → '/'; split dev → the configured client origin.
const appHome = () => (config.clientOrigin ? config.clientOrigin.split(',')[0].trim() : '/')

// Public: which provider is active, so the client shows the right button.
router.get('/config', (req, res) => res.json({ provider: authProvider.id, kind: authProvider.kind }))

// Direct login (sample): the client POSTs and gets a session immediately.
router.post('/login', async (req, res) => {
  if (authProvider.kind !== 'direct') {
    return res.status(400).json({ error: 'This provider uses redirect login (GET /api/auth/login).' })
  }
  try {
    const user = await authProvider.login(req)
    issueSession(res, user)
    res.json({ user })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Browser-initiated login. Redirect providers (Entra) → the authorize URL;
// direct providers → sign in and bounce home (a convenience entry point).
router.get('/login', async (req, res) => {
  try {
    if (authProvider.kind === 'redirect') {
      return res.redirect(await authProvider.authUrl(req, res))
    }
    const user = await authProvider.login(req)
    issueSession(res, user)
    return res.redirect(appHome())
  } catch (e) {
    return res.redirect(`${appHome()}?auth_error=${encodeURIComponent(e.message)}`)
  }
})

// OIDC/OAuth callback for redirect providers (e.g. Entra).
router.get('/callback', async (req, res) => {
  if (authProvider.kind !== 'redirect') return res.status(404).end()
  try {
    const user = await authProvider.callback(req, res)
    issueSession(res, user)
    res.redirect(appHome())
  } catch (e) {
    res.redirect(`${appHome()}?auth_error=${encodeURIComponent(e.message)}`)
  }
})

router.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

export default router
