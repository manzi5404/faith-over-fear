# Faith Over Fear - Deployment Guide

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

## Deployment Architecture

### Frontend (Vercel - Free)
- **Public pages**: All root HTML files (index.html, shop.html, etc.)
- **Admin portal**: Vue app built to `/admin` route
- **Static assets**: CSS, JS, images

### Backend API (Separate Hosting Required)
- **Recommended**: [Railway](https://railway.app) (Free tier: $5/month credit)
- **Alternatives**: Render, Heroku, Fly.io

---

## Backend Deployment (Railway - Recommended)

### Step 1: Prepare Backend for Deployment

1. Navigate to the backend directory:
   ```bash
   cd fof-backend
   ```

2. Update `package.json` with start script:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

### Step 2: Deploy to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up

2. **New Project**: Click "New Project" → "Deploy from GitHub"

3. **Connect Repository**: Select your GitHub repository

4. **Configure Backend**:
   - Set root directory to `fof-backend`
   - Railway will auto-detect Node.js

5. **Add Environment Variables** in Railway dashboard:
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

6. **Add MySQL Database**:
   - In Railway project, click "Add Plugin" → "MySQL"
   - Note the connection details for environment variables

7. **Deploy**: Railway will automatically deploy

8. **Note your backend URL**: It will be something like `https://fof-backend.up.railway.app`

---

## Frontend Deployment (Vercel - Free)

### Step 1: Update API Configuration

1. Edit `vercel.json` and replace `YOUR-BACKEND-URL.railway.app` with your actual backend URL:

```json
{
  "src": "/api/(.*)",
  "dest": "https://fof-backend.up.railway.app/api/$1"
}
```

2. Update your HTML files to point to the correct API URL. Add this before closing `</head>` in each HTML file:

```html
<script>
  window.API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://fof-backend.up.railway.app';
</script>
```

Or update the JavaScript files that make API calls to use environment-based URLs.

### Step 2: Deploy to Vercel

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up with GitHub

2. **Import Project**: Click "Add New" → "Project" → Import from GitHub

3. **Configure Project**:
   - Framework Preset: "Other"
   - Root Directory: `.` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables** (if needed):
   ```
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

---

## Alternative: Using Vercel for Everything

If you prefer to use Vercel serverless functions instead of Railway:

### Option A: Vercel Serverless Functions

Create API routes in `api/` directory:

```bash
mkdir -p api
```

Move backend logic to serverless functions:

```javascript
// api/products.js
module.exports = (req, res) => {
  // Your product API logic here
};
```

### Option B: Vercel Edge Functions

For simpler APIs, use Edge Functions:

```javascript
// api/products.js
export default async function handler(req, res) {
  res.json({ message: 'API response' });
}
```

**Note**: The current backend uses MySQL with connection pooling which requires a traditional Node.js server. For production, Railway is recommended.

---

## Admin Portal Configuration

The admin portal is located at `frontend/src/admin/drops/` and is built separately.

### Build Configuration

The `vite.config.js` in the admin folder builds to `dist/admin/`:

```javascript
// frontend/src/admin/drops/vite.config.js
export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../../../dist/admin'),
    emptyOutDir: true
  }
});
```

### Accessing Admin Portal

After deployment:
- **Production**: `https://your-domain.com/admin`
- **Local**: `https://localhost:5173/admin` (after running dev server)

### Admin API Configuration

Update the admin portal to use your backend URL. Edit `frontend/src/admin/drops/DropService.js`:

```javascript
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://fof-backend.up.railway.app';
```

---

## Local Development

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server (frontend only)
npm run dev

# Build for production
npm run build
```

### Backend Development

```bash
# Navigate to backend
cd fof-backend

# Install dependencies
npm install

# Start backend server
npm start

# Or with auto-reload
npm run dev
```

### Full Stack Development

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
cd fof-backend && npm start
```

---

## Environment Variables Reference

### Backend (.env in fof-backend/)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=fof_database
JWT_SECRET=your-secret-key-min-32-chars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend

No environment variables needed for static deployment. API URLs are configured in JavaScript.

---

## Troubleshooting

### CORS Issues

If you get CORS errors after deployment:
1. Check that the backend CORS configuration allows your frontend domain
2. Update `fof-backend/server.js`:
   ```javascript
   app.use(cors({
     origin: ['https://your-frontend.vercel.app'],
     credentials: true
   }));
   ```

### 404 on Refresh (Vercel)

The `vercel.json` includes a catch-all route to `index.html`. If pages still 404:
1. Check that `dist/` contains all HTML files
2. Verify the build completed successfully

### Admin Portal Not Loading

1. Ensure `dist/admin/` folder exists with `index.html`
2. Check browser console for JavaScript errors
3. Verify API_BASE_URL is set correctly

### Build Failures

1. Clear Vercel cache: Settings → Git → Fresh Deployment
2. Check build logs for specific errors
3. Run `npm run build` locally to debug

---

## Free Platform Options Comparison

| Platform | Backend | Database | Free Tier |
|----------|---------|----------|-----------|
| Railway | ✅ Node.js | MySQL, Postgres | $5/month credit |
| Render | ✅ Node.js | Postgres | 750 hours/month |
| Fly.io | ✅ Node.js | Postgres (external) | 3 shared VMs |
| Heroku | ✅ Node.js | Postgres (limited) | 550 hours/month |
| Vercel | ⚠️ Serverless | ❌ External only | Unlimited static |

---

## Security Notes

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use HTTPS** - All deployments should use HTTPS
3. **Validate Admin Access** - Ensure admin routes require authentication
4. **Sanitize Inputs** - The existing code uses express-validator

---

## Support

For deployment issues, check:
1. Platform-specific documentation (Vercel, Railway)
2. Build logs in deployment dashboard
3. Browser developer console for frontend issues
4. Server logs for backend issues
