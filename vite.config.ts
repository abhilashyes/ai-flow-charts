import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project is served from https://<user>.github.io/ai-flow-charts/ on GitHub
// Pages, so the production build needs that sub-path as its base. The dev server
// keeps serving from root for convenience.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ai-flow-charts/' : '/',
}))
