import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// CORRECCIÓN: El proxy /api redirige al backend SIN eliminar el prefijo /api.
// Antes: rewrite eliminaba /api → las rutas del backend no coincidían.
// Ahora: el backend debe exponer /api/agent/chat, /api/consultas, /api/files/upload.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3002'

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['alex.megiddo20.me'],
      watch: {
        usePolling: true
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // CORRECCIÓN: Se eliminó el rewrite que quitaba /api del path.
          // El frontend llama /api/agent/chat → el backend debe tener esa ruta completa.
          // Si el backend NO tiene el prefijo /api, descomenta la siguiente línea:
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
