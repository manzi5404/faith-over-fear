# Alpine.js Module Resolution Fix

## Problem Summary

**Error**: `Uncaught TypeError: Failed to resolve module specifier 'alpinejs'. Relative references must start with '/', './', or '../'.`

**Root Cause**: The Vite build configuration was copying HTML files to the dist folder BEFORE processing them, which meant the HTML files retained their development-time script references (`<script type="module" src="/src/js/main.js"></script>`). When deployed to production, browsers attempted to load `/src/js/main.js`, which contains bare module imports like `import Alpine from 'alpinejs'`. Browsers cannot resolve these bare module specifiers without a bundler.

## The Fix

### What Changed

Modified [`vite.config.js`](vite.config.js) to properly process HTML files through Vite's build pipeline instead of copying them manually.

### Before (Broken Configuration)

```javascript
// HTML files were copied BEFORE build
rootHtmlFiles.forEach(file => {
  const src = path.resolve(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);  // ❌ Manual copy - no processing
  }
});

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,  // ❌ Kept old files
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')  // ❌ Only one file
      }
    }
  }
});
```

**Result**: HTML files in dist/ still had `<script type="module" src="/src/js/main.js"></script>`, causing browser module resolution errors.

### After (Fixed Configuration)

```javascript
// Plugin to copy static assets AFTER build
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      // Copy src/ and images/ directories after build completes
      // (CSS, images, etc.)
    }
  };
}

// Build input object for all HTML files
const htmlInputs = {};
rootHtmlFiles.forEach(file => {
  const name = file.replace('.html', '');
  htmlInputs[name] = path.resolve(__dirname, file);
});

export default defineConfig({
  base: '/',  // ✅ Absolute paths for Vercel
  plugins: [vue(), react(), copyStaticAssets()],  // ✅ Copy after build
  build: {
    outDir: 'dist',
    emptyOutDir: true,  // ✅ Clean build
    rollupOptions: {
      input: htmlInputs  // ✅ All HTML files processed
    }
  }
});
```

**Result**: Vite processes all HTML files, bundles Alpine.js and dependencies, and injects proper script tags:

```html
<script type="module" crossorigin src="/assets/style-Bww9t9z0.js"></script>
<script type="module" crossorigin src="/assets/module.esm-CwKKyv8g.js"></script>
<script type="module" crossorigin src="/assets/main-eWfeVMaO.js"></script>
```

## How It Works Now

1. **Development**: Vite dev server resolves bare imports on-the-fly
2. **Build**: Vite processes all HTML files listed in `rollupOptions.input`
3. **Bundling**: Alpine.js and all dependencies are bundled into `/assets/*.js`
4. **Injection**: Vite automatically updates HTML files with correct script references
5. **Production**: Browsers load pre-bundled JavaScript with no module resolution needed

## Build Output Structure

```
dist/
├── index.html              # ✅ Processed with injected scripts
├── shop.html               # ✅ Processed with injected scripts
├── cart.html               # ✅ Processed with injected scripts
├── [other HTML files]      # ✅ All processed
├── assets/
│   ├── main-eWfeVMaO.js           # ✅ Bundled Alpine.js + app code
│   ├── module.esm-CwKKyv8g.js     # ✅ Alpine.js core
│   ├── style-Bww9t9z0.js          # ✅ Style imports
│   └── style-OkD-pd6L.css         # ✅ Compiled CSS
├── src/                    # ✅ Copied for direct CSS references
└── images/                 # ✅ Copied for image assets
```

## Verification Steps

### 1. Check Build Output
```bash
npm run build:frontend
```

Expected output:
```
✓ 481 modules transformed.
✓ built in 3.47s
✓ Copied src/ to dist/src/
✓ Copied images/ to dist/images/
```

### 2. Verify HTML Files Have Bundled Scripts
```bash
# Windows PowerShell
Get-Content dist/index.html | Select-String -Pattern 'script'

# Expected output:
# <script type="module" crossorigin src="/assets/style-Bww9t9z0.js"></script>
# <script type="module" crossorigin src="/assets/module.esm-CwKKyv8g.js"></script>
# <script type="module" crossorigin src="/assets/main-eWfeVMaO.js"></script>
```

### 3. Verify Alpine.js is Bundled
```bash
# Check that Alpine code exists in bundle
Get-Content dist/assets/module.esm-CwKKyv8g.js -Raw | Select-String "Alpine"
```

## Deployment to Vercel

### Current Configuration (No Changes Needed)

The [`vercel.json`](vercel.json) is already properly configured:

```json
{
  "routes": [
    {
      "src": "^/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "^/$",
      "dest": "/index.html"
    },
    {
      "src": "^/([^\\.]+)$",
      "dest": "/$1.html"
    }
  ]
}
```

### Deployment Steps

1. **Commit the fix**:
   ```bash
   git add vite.config.js
   git commit -m "Fix Alpine.js module resolution for production"
   git push
   ```

2. **Vercel will automatically**:
   - Run `npm run vercel-build` (which runs `npm run build`)
   - Deploy the `dist/` folder
   - Serve bundled assets from `/assets/`

3. **Verify deployment**:
   - Visit your Vercel URL
   - Open browser DevTools Console
   - Should see no module resolution errors
   - Alpine.js functionality should work (dropdowns, modals, etc.)

## Why This Fix Works

### The Problem with Bare Imports
```javascript
// This works in development with Vite dev server:
import Alpine from 'alpinejs';

// But browsers cannot resolve 'alpinejs' in production
// They need a full path like:
import Alpine from '/node_modules/alpinejs/dist/module.esm.js';
```

### The Solution: Bundling
Vite bundles all imports into a single file (or code-split chunks) with resolved paths:
```javascript
// In dist/assets/main-eWfeVMaO.js:
// All Alpine.js code is included directly, no imports needed
var Alpine = { /* Alpine.js code here */ };
```

## Files Modified

- [`vite.config.js`](vite.config.js) - Complete rewrite of build configuration

## Files NOT Modified (Preserved Functionality)

- All HTML files (index.html, shop.html, etc.) - No changes needed
- [`src/js/main.js`](src/js/main.js) - Alpine.js imports remain unchanged
- [`package.json`](package.json) - No dependency changes
- [`vercel.json`](vercel.json) - Already properly configured

## Testing Checklist

- [x] Build completes without errors
- [x] HTML files in dist/ have bundled script references
- [x] Alpine.js code is present in bundled JavaScript
- [x] No bare module imports in production HTML
- [x] Static assets (CSS, images) are copied correctly
- [x] Vercel routing configuration is compatible

## Expected Behavior After Fix

### Before Fix
- ❌ Browser console: "Failed to resolve module specifier 'alpinejs'"
- ❌ Alpine.js directives (x-data, x-show, etc.) don't work
- ❌ Dropdowns, modals, and interactive features broken

### After Fix
- ✅ No module resolution errors
- ✅ Alpine.js initializes correctly
- ✅ All x-data, x-show, x-if directives work
- ✅ Dropdowns, modals, and interactive features functional
- ✅ GSAP animations work
- ✅ Shop logic and product logic work

## Additional Notes

- **No CDN needed**: Alpine.js is properly bundled, no need for CDN fallback
- **Code splitting**: Vite automatically splits Alpine.js core into a separate chunk for better caching
- **Hash-based filenames**: Asset filenames include content hashes (e.g., `main-eWfeVMaO.js`) for cache busting
- **Minimal changes**: Only vite.config.js was modified, preserving all existing functionality

## Troubleshooting

If you still see module errors after deployment:

1. **Clear Vercel cache**: Redeploy with "Clear Cache and Deploy"
2. **Check build logs**: Ensure `npm run build` completes successfully
3. **Verify dist/ contents**: Check that HTML files have `/assets/*.js` script tags
4. **Browser cache**: Hard refresh (Ctrl+Shift+R) to clear browser cache

## Summary

The fix ensures that Vite properly processes all HTML files during the build, bundling Alpine.js and all dependencies into browser-compatible JavaScript files. This eliminates bare module specifier errors and ensures all Alpine.js functionality works correctly in production on Vercel.
