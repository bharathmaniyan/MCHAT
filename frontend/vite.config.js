import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9090',   // ← Spring Boot runs on 9090
        changeOrigin: true,
        secure: false,
      },
      '/qr': {
        target: 'http://localhost:9090',   // ← static QR images served by Spring Boot
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
