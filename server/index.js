import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { config, useMongo } from './config.js'
import { connectDb } from './db.js'
import authRoutes from './routes/auth.js'
import flowRoutes from './routes/flows.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  if (useMongo) {
    try {
      await connectDb()
    } catch (e) {
      console.error('[db] connection failed:', e.message)
      process.exit(1)
    }
  } else {
    console.log('[db] MONGODB_URI not set — using in-memory repository (data is NOT persisted).')
  }

  const app = express()
  app.use(express.json({ limit: '5mb' }))
  app.use(cookieParser())
  // Split-dev CORS: allow the client origin with credentials. When the server
  // also serves the client (prod), requests are same-origin and this is moot.
  const origins = config.clientOrigin ? config.clientOrigin.split(',').map((s) => s.trim()) : []
  app.use(cors({ origin: origins.length ? origins : true, credentials: true }))

  app.get('/api/health', (req, res) =>
    res.json({ ok: true, storage: useMongo ? 'mongodb' : 'memory', auth: config.authProvider }),
  )
  app.use('/api/auth', authRoutes)
  app.use('/api/flows', flowRoutes)

  // In production the server also serves the built client (single container).
  const dist = path.resolve(__dirname, '..', 'dist')
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
    console.log('[server] serving client from', dist)
  }

  app.listen(config.port, () =>
    console.log(`[server] listening on :${config.port} (auth=${config.authProvider}, storage=${useMongo ? 'mongodb' : 'memory'})`),
  )
}

main()
