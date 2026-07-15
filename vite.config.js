import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path:
//  - GitHub Pages serves from /ai-flow-charts/ (default for a build).
//  - When the Express server hosts the client (docker/self-hosted), set APP_BASE=/
//    so asset paths resolve at the domain root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.APP_BASE ?? (command === 'build' ? '/ai-flow-charts/' : '/'),
}))
