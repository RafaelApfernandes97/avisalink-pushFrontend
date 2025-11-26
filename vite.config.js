import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin para substituir __API_URL__ no service worker
const serviceWorkerPlugin = () => {
  return {
    name: 'service-worker-api-url',
    writeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js')
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8')
        const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000/api'
        content = content.replace(/__API_URL__/g, apiUrl)
        fs.writeFileSync(swPath, content)
        console.log(`✅ Service Worker atualizado com API_URL: ${apiUrl}`)
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    serviceWorkerPlugin()
  ],
  server: {
    port: 3001,
    // Proxy desabilitado - usando VITE_API_URL do .env.local
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001/',
    //     changeOrigin: true,
    //   },
    // },
  },
})
