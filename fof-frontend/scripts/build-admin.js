import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const cwd = process.cwd();
const srcDir = path.join(cwd, '..', 'frontend', 'src', 'admin', 'drops');
const dstDir = path.join(cwd, 'src', 'admin', 'drops');

if (!fs.existsSync(srcDir)) {
  console.error('Admin source not found at', srcDir);
  process.exit(1);
}

fs.cpSync(srcDir, dstDir, { recursive: true, force: true });
console.log('Copied admin source to', dstDir);

const configPath = path.join(dstDir, 'vite.config.js');
let config = fs.readFileSync(configPath, 'utf8');

config = config.replace("import { defineConfig } from 'vite';", "const defineConfig = (config) => config;");
config = config.replace(
  "const outDir = path.resolve(__dirname, '../../../../dist/admin');",
  "const outDir = path.resolve(process.cwd(), 'dist', 'admin');"
);

fs.writeFileSync(configPath, config);
console.log('Patched vite.config.js for Netlify build');

try {
  execSync('npx vite build --config src/admin/drops/vite.config.js', { stdio: 'inherit', cwd });
} catch (err) {
  console.error('Admin build failed:', err.message);
  process.exit(1);
}

const adminDist = path.join(cwd, 'dist', 'admin');
if (!fs.existsSync(adminDist)) {
  console.error('Admin build not found at', adminDist);
  process.exit(1);
}

fs.rmSync(dstDir, { recursive: true, force: true });
console.log('Admin build ready at', adminDist);
