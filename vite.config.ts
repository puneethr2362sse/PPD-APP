import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(process.env.VITE_PORT || env.VITE_PORT) || 5173
  const apiTarget = process.env.VITE_API_TARGET || env.VITE_API_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host: true,
      watch: {
        ignored: ['**/*.zip', '**/data/**', '**/*.log', '**/.git/**'],
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
