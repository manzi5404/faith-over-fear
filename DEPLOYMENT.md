# Faith Over Fear - Deployment Guide (Fixed)

This document provides step-by-step instructions for deploying the Faith Over Fear e-commerce platform.

## Project Structure Overview

```
faith-over-fear/
├── index.html, shop.html, lookbook.html, etc.  # Public HTML pages (root)
├── frontend/src/admin/drops/                   # Vue admin portal
├── fof-backend/                                # Express + MySQL backend API
├── src/css/style.css                           # Main styles
├── src/js/                                      # JavaScript files
├── images/                                      # Image assets
├── vercel.json                                  # Vercel configuration
└── vite.config.js                               # Vite build configuration
```

---

## What Was Fixed

### The MIME Type Error
**Problem**: "Failed to load module script: Expected a JavaScript module but server responded with MIME type text/html"

**Root Cause**: The original `vercel.json` used a catch-all route that rewrote ALL requests (including JS/CSS files) to `/index.html`:
```json
// WRONG - rewrites assets/* to index.html
{ "src": "/(.*)", "dest": "/index.html" }
```

**Solution**: Use `rewrites` with negative lookahead to exclude static assets:
```json
// CORRECT - only rewrites non-asset routes to index.html
{
  "source": "/((?!assets|images|admin|src|favicon).*)",
  "destination": "/index.html"
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `vercel.json` | Fixed rewrites to not rewrite static assets |
| `vite.config.js` | Copies src/ and images/ to dist/ for direct access |

---

## Deployment Architecture

### Frontend (Vercel - Free)
- **Public pages**: All root HTML files (index.html, shop.html, etc.)
- **Admin portal**: Vue app built to `/admin` route
- **Static assets**: `/assets/*`, `/src/*`, `/images/*` served directly

### Backend API (Separate Hosting Required)
- **Recommended**: [Railway](https://railway.app) (Free tier: $5/month credit)
- **Alternatives**: Render, Heroku, Fly.io

---

## Deployment Steps

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **New Project**: Click "New Project" → "Deploy from GitHub"

3. **Connect Repository**: Select your repository, set root to `fof-backend`

4. **Add Environment Variables**:
   ```
   PORT=5000
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=your-database-name
   JWT_SECRET=your-jwt-secret
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

5. **Add MySQL Database**: Add Plugin → MySQL

6. **Deploy**: Railway auto-deploys on push

7. **Copy your backend URL**: e.g., `https://fof-backend.up.railway.app`

### Step 2: Update vercel.json with Your Backend URL

Edit `vercel.json` and replace `YOUR-BACKEND-URL.railway.app`:

```json
"destination": "https://fof-backend.up.railway.app/api/:path*"
```

### Step 3: Deploy Frontend to Vercel

1. **Connect to Vercel**: Go to [vercel.com](https://vercel.com)

2. **Import Project**: Add New → Project → Import from GitHub

3. **Configure**:
   - Framework Preset: Other
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Deploy**: Click Deploy

5. **Redeploy after vercel.json changes**: Push changes or trigger fresh deploy

---

## Build Verification

Run locally to verify:
```bash
npm run build
```

Expected output:
```
dist/
├── index.html, shop.html, ... (15 HTML files)
├── assets/
│   ├── main-xxxx.js
│   └── main-xxxx.css
├── images/
├── src/
│   ├── css/style.css
│   └── js/*.js
└── admin/
    ├── index.html
    ├── index.js
    └── index.css
```

---

## Routing Behavior (After Fix)

| URL | Behavior |
|-----|----------|
| `/` | Serves `/index.html` |
| `/shop` | Serves `/index.html` (SPA fallback) |
| `/assets/*` | Serves files from `dist/assets/` |
| `/src/*` | Serves files from `dist/src/` |
| `/images/*` | Serves files from `dist/images/` |
| `/admin` | Serves `dist/admin/index.html` |
| `/admin/*` | Serves `dist/admin/*` |
| `/api/*` | Proxies to backend API |

---

## Troubleshooting

### Still Getting MIME Type Error?
1. Clear Vercel cache: Settings → Git → Fresh Deployment
2. Verify `dist/` contains `assets/` folder
3. Check browser Network tab - what URL is returning HTML?

### 404 on Pages
1. Verify `vercel.json` has the correct rewrite rule
2. Ensure output directory is `dist`
3. Check that HTML files exist in `dist/`

### Admin Portal Not Loading
1. Verify `dist/admin/` folder exists
2. Check `vercel.json` has `/admin/(.*)` route
3. Verify admin HTML has correct asset paths

---

## Free Platform Options

| Platform | Backend | Database | Free Tier |
|----------|---------|----------|-----------|
| Railway | ✅ Node.js | MySQL, Postgres | $5/month credit |
| Render | ✅ Node.js | Postgres | 750 hours/month |
| Fly.io | ✅ Node.js | Postgres (ext) | 3 shared VMs |
| Heroku | ✅ Node.js | Postgres (lim) | 550 hours/month |
| Vercel | ⚠️ Serverless | ❌ External | Unlimited static |

---

## Security Notes

1. **Never commit `.env` files**
2. **Use HTTPS** on all deployments
3. **Validate Admin Access** - existing auth middleware protects routes
