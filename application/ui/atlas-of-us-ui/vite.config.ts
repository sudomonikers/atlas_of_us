import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
  //three.js is ~900kB on its own, so the default 500kB warning is just noise
  build: { chunkSizeWarningLimit: 1000 },
})
