import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/ai-flow-charts/ on GitHub Pages, so the
// production build needs that sub-path as its base. Dev stays at root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ai-flow-charts/' : '/',
}))
