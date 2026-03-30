import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// Build admin portal to ../../../dist/admin directory
// __dirname is frontend/src/admin/drops
// ../../../.. is the root project directory
const outDir = path.resolve(__dirname, '../../../../dist/admin');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  base: './',
  build: {
    outDir: outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
