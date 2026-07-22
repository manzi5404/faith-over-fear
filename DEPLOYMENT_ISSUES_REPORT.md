# Faith Over Fear - Deployment Issues Analysis

## Executive Summary

The deployed app is experiencing **404 errors** and **MIME type errors** due to a **critical missing route** in [`vercel.json`](vercel.json:1). The configuration is incomplete and missing the catch-all route for serving static files.

---

## CRITICAL ISSUE #1: Missing Catch-All Route in vercel.json

**File:** [`vercel.json`](vercel.json:7-20)  
**Lines:** 7-20  
**Severity:** CRITICAL  
**Confidence:** 100%

### Problem

The [`vercel.json`](vercel.json:1) is **missing the final catch-all route** that serves static files. The current configuration only has 3 routes:

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "https://faithoverfear-backend.railway.app/api/$1"
  },
  {
    "src": "/admin$",
    "dest": "/admin/index.html"
  },
  {
    "src": "/admin/(.*)",
    "dest": "/admin/$1"
  }
]
```

**What's missing:** A catch-all route `"src": "/(.*)"` to serve all other static files from the `dist/` directory.

### Impact

- ❌ `/index.html` → 404 NOT_FOUND
- ❌ `/shop.html` → 404 NOT_FOUND  
- ❌ `/login.html` → 404 NOT_FOUND
- ❌ All other HTML pages → 404 NOT_FOUND
- ❌ When HTML fails to load, JS modules get HTML error pages instead → MIME type error

### Root Cause

When Vercel receives a request like `/index.html`, it checks the routes in order:
1. Does it match `/api/(.*)`? No
2. Does it match `/admin$`? No
3. Does it match `/admin/(.*)`? No
4. **No more routes** → Returns 404

The browser then tries to load `/assets/main-eWfeVMaO.js` but gets a 404 HTML error page, causing:
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but server responded with MIME type text/html
```

### Fix

**File:** [`vercel.json`](vercel.json:1)  
**Action:** Add the missing catch-all route at the end

```json
{
  "version": 2,
  "name": "faithoverfearrw",
  "builds": [
    { "src": "dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://faithoverfear-backend.railway.app/api/$1"
    },
    {
      "src": "/admin$",
      "dest": "/admin/index.html"
    },
    {
      "src": "/admin/(.*)",
      "dest": "/admin/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

**Risk Level:** LOW - This is a standard Vercel configuration pattern

---

## ISSUE #2: Admin Portal Asset Paths (Relative vs Absolute)

**File:** [`dist/admin/index.html`](dist/admin/index.html:16-17)  
**Lines:** 16-17  
**Severity:** WARNING  
**Confidence:** 85%

### Problem

The admin portal HTML uses **relative paths** for assets:

```html
<script type="module" crossorigin src="./index.js"></script>
<link rel="stylesheet" crossorigin href="./index.css">
```

This works when accessing `/admin/` or `/admin/index.html`, but could fail if:
- User navigates to `/admin` (without trailing slash)
- Deep linking within the admin SPA

### Current Behavior

- ✅ `/admin/` → Loads `./index.js` → Resolves to `/admin/index.js` ✓
- ⚠️ `/admin` → Redirects to `/admin/index.html` → Loads `./index.js` → May resolve incorrectly

### Fix Option 1: Update Vite Config (Recommended)

**File:** [`frontend/src/admin/drops/vite.config.js`](frontend/src/admin/drops/vite.config.js:19)  
**Line:** 19  
**Action:** Change `base` from `'./'` to `'/admin/'`

```javascript
export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  base: '/admin/',  // Changed from './'
  build: {
    outDir: outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
```

Then rebuild: `npm run build:admin`

This will generate:
```html
<script type="module" crossorigin src="/admin/index.js"></script>
<link rel="stylesheet" crossorigin href="/admin/index.css">
```

**Risk Level:** LOW - Standard practice for SPAs deployed to subdirectories

### Fix Option 2: Manual HTML Edit (Quick Fix)

**File:** [`dist/admin/index.html`](dist/admin/index.html:16-17)  
**Action:** Manually change paths to absolute

```html
<script type="module" crossorigin src="/admin/index.js"></script>
<link rel="stylesheet" crossorigin href="/admin/index.css">
```

**Risk Level:** VERY LOW - But will be overwritten on next build

---

## ISSUE #3: Backend API URL Configuration

**File:** [`vercel.json`](vercel.json:10)  
**Line:** 10  
**Severity:** INFO  
**Confidence:** 90%

### Current Configuration

```json
"dest": "https://faithoverfear-backend.railway.app/api/$1"
```

### Verification Needed

Confirm that:
1. ✅ Railway backend is deployed at `https://faithoverfear-backend.railway.app`
2. ✅ Backend server is running and accessible
3. ✅ Backend routes are prefixed with `/api/` (confirmed in [`fof-backend/server.js`](fof-backend/server.js:51-57))

### Test Commands

```bash
# Test backend health
curl https://faithoverfear-backend.railway.app/api/auth/login

# Should return 400 or 401, not 404
```

If the backend URL is different, update line 10 in [`vercel.json`](vercel.json:10).

---

## ISSUE #4: Root server.js is Incomplete (Non-Blocking)

**File:** [`server.js`](server.js:1-69)  
**Severity:** INFO  
**Confidence:** 95%

### Problem

The root [`server.js`](server.js:1) is an ES module that imports from non-existent paths:

```javascript
import connectDB from "./src/config/db.js";  // ❌ File doesn't exist
import dropRoutes from "./src/routes/dropRoutes.js";  // ❌ File doesn't exist
```

The actual working backend is [`fof-backend/server.js`](fof-backend/server.js:1) (CommonJS).

### Impact

**None** - This file is not used in deployment. Railway deploys the `fof-backend/` directory separately.

### Recommendation

**Action:** Delete or rename [`server.js`](server.js:1) to avoid confusion

```bash
# Option 1: Delete
del server.js

# Option 2: Rename for reference
move server.js server.js.unused
```

**Risk Level:** NONE - File is not referenced in any deployment config

---

## ISSUE #5: Frontend Asset Paths (Already Correct)

**Files:** All HTML files in [`dist/`](dist/)  
**Severity:** NONE  
**Status:** ✅ WORKING CORRECTLY

### Analysis

All frontend HTML files use **absolute paths** for assets:

```html
<!-- dist/index.html -->
<script type="module" crossorigin src="/assets/main-eWfeVMaO.js"></script>
<link rel="stylesheet" crossorigin href="/assets/style-OkD-pd6L.css">

<!-- dist/login.html -->
<script type="module" crossorigin src="/assets/login-DzH8SWNA.js"></script>
```

These will work correctly once the catch-all route is added to [`vercel.json`](vercel.json:1).

**No action needed.**

---

## ISSUE #6: API Calls in Frontend (Already Correct)

**Files:** All JS files in [`dist/assets/`](dist/assets/)  
**Severity:** NONE  
**Status:** ✅ WORKING CORRECTLY

### Analysis

All API calls use **relative paths** starting with `/api/`:

```javascript
// From dist/assets/login-DzH8SWNA.js
fetch("/api/auth/login", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({email: this.email, password: this.password})
})
```

These will be correctly proxied to Railway backend via [`vercel.json`](vercel.json:9-11) route:

```json
{
  "src": "/api/(.*)",
  "dest": "https://faithoverfear-backend.railway.app/api/$1"
}
```

**No action needed.**

---

## Summary of Required Actions

### CRITICAL (Must Fix Immediately)

1. **Add catch-all route to [`vercel.json`](vercel.json:1)**
   - Add `{ "src": "/(.*)", "dest": "/$1" }` as the last route
   - Commit and push to trigger Vercel redeployment

### RECOMMENDED (Fix Before Next Deployment)

2. **Update admin Vite config [`frontend/src/admin/drops/vite.config.js`](frontend/src/admin/drops/vite.config.js:19)**
   - Change `base: './'` to `base: '/admin/'`
   - Rebuild: `npm run build:admin`

3. **Remove unused root [`server.js`](server.js:1)**
   - Delete or rename to avoid confusion

### VERIFICATION (After Deployment)

4. **Test all routes:**
   ```bash
   # Frontend pages
   curl -I https://your-domain.vercel.app/
   curl -I https://your-domain.vercel.app/shop.html
   curl -I https://your-domain.vercel.app/login.html
   
   # Admin portal
   curl -I https://your-domain.vercel.app/admin/
   
   # API proxy
   curl -X POST https://your-domain.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```

---

## Deployment Checklist

- [ ] Fix [`vercel.json`](vercel.json:1) - Add catch-all route
- [ ] Commit changes: `git add vercel.json && git commit -m "fix: add catch-all route for static files"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Wait for Vercel auto-deployment
- [ ] Test frontend pages (should return 200, not 404)
- [ ] Test admin portal at `/admin/`
- [ ] Test API calls from browser console
- [ ] (Optional) Update admin Vite config and rebuild
- [ ] (Optional) Remove unused root `server.js`

---

## Expected Results After Fix

✅ All HTML pages load correctly (200 OK)  
✅ All CSS/JS assets load correctly  
✅ No MIME type errors  
✅ API calls proxy correctly to Railway backend  
✅ Admin portal loads at `/admin/`  
✅ No 404 errors

---

## Technical Details

### Vercel Static File Serving

When you configure:
```json
"builds": [{ "src": "dist/**", "use": "@vercel/static" }]
```

Vercel serves the `dist/` directory as the root. Files are accessible at:
- `dist/index.html` → `/index.html`
- `dist/assets/main.js` → `/assets/main.js`
- `dist/admin/index.html` → `/admin/index.html`

### Route Matching Order

Vercel processes routes **in order** from top to bottom. The first matching route wins:

1. `/api/*` → Proxy to Railway
2. `/admin` → Serve `/admin/index.html`
3. `/admin/*` → Serve from `/admin/` directory
4. `/*` → Serve from root (THIS IS MISSING)

Without the catch-all route, any request that doesn't match routes 1-3 returns 404.

---

## Contact

If issues persist after applying these fixes, check:
1. Vercel deployment logs
2. Railway backend logs
3. Browser console for specific error messages
4. Network tab to see which requests are failing
