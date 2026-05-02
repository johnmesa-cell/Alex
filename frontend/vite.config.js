import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3002'

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['alex.megiddo20.me'],  // ← esto es lo que falta
      watch: {
        usePolling: true
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
