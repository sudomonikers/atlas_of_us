import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

//the atlas-api to send requests to, ATLAS_API when it's set, so a second copy of the ui can talk to a second api
const api = process.env.ATLAS_API ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': api, '/share': api } },
})
