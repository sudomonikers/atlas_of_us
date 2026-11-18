import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

//the atlas-api to send requests to, ATLAS_API when it's set, so the app can talk to a second copy of the api
const api = process.env.ATLAS_API ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5175, proxy: { '/api': api } },
})
