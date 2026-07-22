import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    vue(),
    tsconfigPaths()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://faith-over-fear-mqgz.onrender.com',
        changeOrigin: true,
      },
    },
  },
})