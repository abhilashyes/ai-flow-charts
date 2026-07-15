import jwt from 'jsonwebtoken'
import { config } from '../config.js'

// Session = a signed JWT in an httpOnly cookie. This shape is provider-agnostic:
// the sample provider mints it directly; a future Entra provider would mint the
// same cookie after validating the OIDC id_token.

export function issueSession(res, user) {
  const token = jwt.sign(
    { sub: user.id, name: user.name, provider: user.provider },
    config.jwtSecret,
    { expiresIn: '7d' },
  )
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 7 * 24 * 3600 * 1000,
  })
}

export function clearSession(res) {
  res.clearCookie(config.cookieName)
}

export function readSession(req) {
  const token = req.cookies?.[config.cookieName]
  if (!token) return null
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }
}

// Express middleware: 401 unless a valid session cookie is present.
export function requireAuth(req, res, next) {
  const s = readSession(req)
  if (!s) return res.status(401).json({ error: 'unauthenticated' })
  req.user = { id: s.sub, name: s.name, provider: s.provider }
  next()
}
