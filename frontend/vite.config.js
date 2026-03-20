import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto permite que el servidor sea accesible desde fuera del contenedor
    port: 5173,
    watch: {
      usePolling: true // A veces necesario en Docker en Windows para detectar cambios
    }
  }
})
