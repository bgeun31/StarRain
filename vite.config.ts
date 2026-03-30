import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/nexon-api': {
        target: 'https://open.api.nexon.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nexon-api/, ''),
      },
    },
  },
})
