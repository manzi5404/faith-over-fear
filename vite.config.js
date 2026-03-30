import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// List of root HTML pages that need to be copied
const rootHtmlFiles = [
  'index.html', 'shop.html', 'lookbook.html', 'cart.html', 'product.html',
  'contact.html', 'about.html', 'reservations.html', 'shipping.html',
  'faq.html', 'terms.html', 'login.html', 'signup.html',
  'forgot-password.html', 'reset-password.html'
];

// Create dist directory
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy root HTML files to dist
rootHtmlFiles.forEach(file => {
  const src = path.resolve(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Copy src directory to dist/src (needed for /src/css/style.css references)
const srcDir = path.resolve(__dirname, 'src');
const distSrcDir = path.join(distDir, 'src');
if (fs.existsSync(srcDir) && !fs.existsSync(distSrcDir)) {
  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir(srcDir, distSrcDir);
  console.log('✓ Copied src/ to dist/src/');
}

// Copy images directory to dist/images
const imagesDir = path.resolve(__dirname, 'images');
const distImagesDir = path.join(distDir, 'images');
if (fs.existsSync(imagesDir) && !fs.existsSync(distImagesDir)) {
  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir(imagesDir, distImagesDir);
  console.log('✓ Copied images/ to dist/images/');
}

export default defineConfig({
  root: '.',
  base: './',
  plugins: [vue(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear - we need the copied files
    rollupOptions: {
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
  },
  publicDir: false // Disable default public dir
});
