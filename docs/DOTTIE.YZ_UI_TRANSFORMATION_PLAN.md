# DOTTIE.YZ Complete UI & Branding Transformation Plan

## Objective
Complete visual redesign of DOTTIE.YZ while preserving ALL backend logic, API endpoints, auth, checkout, admin functionality, database schema, and business rules.

## Current Architecture
- **Frontend**: Vite + Tailwind CSS + Alpine.js + GSAP
- **Admin**: Vue 3 + Tailwind CDN + Axios (loaded via CDN in admin/src/admin/drops/index.html)
- **Backend**: Express.js v5.2.1 + PostgreSQL/Supabase + Resend email
- **Store Mode**: `live`, `reserve`, `closed`
- **Payment**: MoMo (Rwanda) + WhatsApp verification
- **Currency**: FRW

## New Design System
### Colors
- Primary: `#000000` (ink/black)
- Paper: `#ffffff` (white)
- Light Blue: `#60a5fa` (primary accent)
- Army Green: `#4b5320` (secondary accent)
- Muted: `#64748b`
- Surface: `#f8fafc`
- Line: `#e2e8f0`

### Typography
- Headings: Oswald (bold, oversized, uppercase)
- Body: Inter (clean, readable)
- Display: Bebas Neue (ultra-bold hero)

## Execution Order

### Step 1: Global Design System ✅
- Update `frontend/src/css/style.css` with new design tokens
- Update `tailwind.config.js` with new colors
- Update `frontend/src/css/intro.css` (already premium quality, keep mostly intact)
- Update `frontend/src/js/main.js` console branding

### Step 2: Root-Level Pages
- `index.html` - New premium hero + brand story sections
- `shop.html` - Modern storefront with sidebar filters
- `product.html` - Clean gallery + info panel
- `cart.html` - Modern cart layout

### Step 3: Supporting Pages
- `about.html` - Premium brand story
- `contact.html` - Modern contact page
- `lookbook.html` - Full-width archive
- `collections.html` - Curated collections
- `faq.html` - Modern accordion
- `shipping.html`, `terms.html` - Clean legal

### Step 4: Auth Pages
- `login.html` - Premium auth card
- `signup.html` - Matching auth design
- `forgot-password.html`, `reset-password.html`

### Step 5: Admin Panel
- Update logo/branding in Vue components
- Update color scheme in admin
- Modernize admin layout

### Step 6: Email Templates
- Rebrand all templates in `backend/utils/email.js`
- Update colors, logos, brand name, contact info

### Step 7: Content & Copy
- Remove Christian references
- Update taglines to streetwear-appropriate copy
- Verify no old brand references

### Step 8: Verification
- Build frontend
- Build admin
- Check for remaining references
- Verify mobile responsiveness

## Verification Checklist
- [ ] `npm run build` succeeds
- [ ] `npm run build:admin` succeeds
- [ ] No "Faith Over Fear" or "F>F" in frontend output
- [ ] No "Faith Over Fear" or "F>F" in email templates
- [ ] All 15 pages render correctly
- [ ] Mobile responsive (375px, 768px, 1024px)
- [ ] Cart/checkout flow works
- [ ] Admin panel loads

## Files Modified (Expected)
- `frontend/src/css/style.css` - Complete redesign (660 lines → ~500 lines)
- `tailwind.config.js` - New colors
- `frontend/src/js/main.js` - Branding updates
- `index.html` (root) - Hero + brand sections
- `frontend/shop.html` - Main storefront
- `frontend/product.html` - Product detail
- `frontend/cart.html` - Cart page
- `frontend/about.html` - Brand story
- `frontend/contact.html` - Contact form
- `frontend/lookbook.html` - Archive
- `frontend/collections.html` - Collections
- `frontend/faq.html` - FAQ
- `frontend/shipping.html`, `frontend/terms.html` - Legal
- `frontend/closed.html` - Store closed (mostly intact)
- `frontend/login.html`, `frontend/signup.html` - Auth
- `backend/utils/email.js` - Email templates
- `admin/src/admin/drops/AdminApp.vue` - Admin branding

## Scope
- 30+ HTML/CSS files modified
- 10+ JS files touched for branding
- 2 email templates updated
- 5+ admin Vue components restyled
- ~500 lines of CSS rewritten
