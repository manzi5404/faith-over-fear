import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Copy root HTML files to dist for Vercel static hosting
const rootHtmlFiles = [
  'index.html', 'shop.html', 'lookbook.html', 'cart.html', 'product.html',
  'contact.html', 'about.html', 'reservations.html', 'shipping.html',
  'faq.html', 'terms.html', 'login.html', 'signup.html',
  'forgot-password.html', 'reset-password.html'
];

// Create dist directory and copy HTML files
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

rootHtmlFiles.forEach(file => {
  const src = path.resolve(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} to dist/`);
  }
});

export default defineConfig({
  root: '.',
  base: './',
  plugins: [vue(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear - we need the HTML files
    rollupOptions: {
      // Only bundle the JS/CSS assets, not HTML
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
