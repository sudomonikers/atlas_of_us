import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    define: {
      __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL)
    },
  };
});
