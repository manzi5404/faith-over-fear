#!/usr/bin/env node

/**
 * Build Test Script
 * Run this locally to verify the deployment build process
 * 
 * Usage: node test-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const adminDir = path.join(distDir, 'admin');

console.log('🧪 Testing Faith Over Fear Build Process\n');

// Clean previous build
console.log('1️⃣  Cleaning previous build...');
try {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
    console.log('   ✓ Removed dist/ directory');
  }
} catch (e) {
  console.log('   ℹ️  No previous build to clean');
}

// Test frontend build
console.log('\n2️⃣  Building frontend (HTML pages)...');
try {
  execSync('npm run build:frontend', { stdio: 'inherit' });
  console.log('   ✓ Frontend build completed');
} catch (e) {
  console.error('   ✗ Frontend build failed');
  process.exit(1);
}

// Test admin portal build
console.log('\n3️⃣  Building admin portal (Vue app)...');
try {
  execSync('npm run build:admin', { stdio: 'inherit' });
  console.log('   ✓ Admin portal build completed');
} catch (e) {
  console.error('   ✗ Admin portal build failed');
  process.exit(1);
}

// Verify output
console.log('\n4️⃣  Verifying build output...');

const htmlFiles = ['index.html', 'shop.html', 'lookbook.html', 'cart.html'];
const missingHtml = htmlFiles.filter(f => !fs.existsSync(path.join(distDir, f)));
if (missingHtml.length > 0) {
  console.error('   ✗ Missing HTML files:', missingHtml.join(', '));
  process.exit(1);
}
console.log('   ✓ All HTML pages present in dist/');

if (!fs.existsSync(path.join(adminDir, 'index.html'))) {
  console.error('   ✗ Admin portal index.html not found');
  process.exit(1);
}
console.log('   ✓ Admin portal present in dist/admin/');

console.log('\n✅ Build test PASSED! Ready for deployment.\n');
console.log('📁 Build output location: ./dist/');
console.log('   - Public pages: ./dist/*.html');
console.log('   - Admin portal: ./dist/admin/');
