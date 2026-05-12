import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
   server: {
    host: '0.0.0.0', // Allow external connections for Docker
    port: 5173,
    watch: {
      usePolling: true, // Required for Docker volume mounts on Windows
    },
    proxy: {
      '/api': {
        target: 'http://backend:8080', // Use Docker service name
        changeOrigin: true,
      },
    },
  },
})
