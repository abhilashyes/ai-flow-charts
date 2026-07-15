import { useCallback, useEffect, useState } from 'react'
import { API_MODE } from '../utils/store'

const API = import.meta.env.VITE_API_URL

// Auth is only enforced in API mode. In local (localStorage) mode there is no
// server, so we return a synthetic local user and skip the login screen.
const LOCAL_USER = { id: 'local', name: 'Local', provider: 'local' }

export function useAuth() {
  const [user, setUser] = useState(API_MODE ? null : LOCAL_USER)
  const [ready, setReady] = useState(!API_MODE)
  const [provider, setProvider] = useState(null) // active server auth provider

  useEffect(() => {
    if (!API_MODE) return
    let cancelled = false
    ;(async () => {
      try {
        const [meRes, cfgRes] = await Promise.all([
          fetch(`${API}/api/auth/me`, { credentials: 'include' }),
          fetch(`${API}/api/auth/config`, { credentials: 'include' }),
        ])
        const me = meRes.ok ? await meRes.json() : null
        const cfg = cfgRes.ok ? await cfgRes.json() : null
        if (!cancelled) {
          setUser(me?.user ?? null)
          setProvider(cfg?.provider ?? null)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async () => {
    const res = await fetch(`${API}/api/auth/login`, { method: 'POST', credentials: 'include' })
    if (!res.ok) throw new Error('Login failed')
    const { user: u } = await res.json()
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  return {
    authRequired: API_MODE,
    ready,
    user,
    provider,
    // Full-page redirect entry point for OIDC providers (e.g. Entra).
    loginUrl: API_MODE ? `${API}/api/auth/login` : null,
    login,
    logout,
  }
}
