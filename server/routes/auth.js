import { Router } from 'express'
import { authProvider } from '../auth/index.js'
import { issueSession, clearSession, requireAuth } from '../auth/session.js'

const router = Router()

// Sample provider: demo sign-in (no password). Entra would add a /callback here.
router.post('/login', async (req, res) => {
  try {
    const user = await authProvider.login(req)
    issueSession(res, user)
    res.json({ user })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

// 401 when not signed in — the client treats that as "logged out".
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

export default router
