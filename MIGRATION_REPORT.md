# Frontend Migration Report

## 1. Executive Summary

The Faith Over Fear project previously had a hybrid frontend (Vue 3 + React 18) with an old Express/MongoDB backend (`fof-backend/` at root) and a new Supabase backend (`fof-backend/src/`).

This report compares the old frontend against the **new backend** and documents:
- What can be reused from the old frontend
- What must be rewritten
- What should be removed
- What should be redesigned

---

## 2. Old Frontend Analysis

### Technology Stack
- **Vue 3** (via CDN/Alpine) — `admin-portal/app.js`, `frontend/src/admin/drops/*.vue`
- **React 18** — mixed in at root level (`index.html`, `shop.html`, etc.)
- **Vanilla JS** — `DropService.js` with direct `fetch()` calls
- **HTML pages** — static HTML files in root (`cart.html`, `product.html`, `login.html`, etc.)
- **Build tool** — Vite with multiple HTML entry points

### Key Problems with Old Frontend

| Problem | Severity | Detail |
|---------|----------|--------|
| Mixed frameworks | HIGH | Vue + React + Alpine in the same project |
| Direct API calls in components | HIGH | No service layer, no error normalization |
| No state management | HIGH | Component-local state only, no caching |
| No TypeScript | HIGH | No type safety, runtime errors |
| No route guards | HIGH | Auth checked inline, not centralized |
| Hardcoded API URLs | HIGH | `server.js` proxy config, no env abstraction |
| Legacy auth flow | HIGH | Used JWT from old backend, not Supabase Auth tokens |
| No feature isolation | MEDIUM | Everything mixed in global namespace |
| Admin panel is Vue SPA | MEDIUM | Incompatible with new React-based architecture |
| HTML pages are static | MEDIUM | No SSR, no hydration, no component reuse |

---

## 3. Backend Comparison

### Old Backend vs New Backend

| Aspect | Old Backend (`fof-backend/`) | New Backend (`fof-backend/src/`) |
|--------|------------------------------|----------------------------------|
| Database | MongoDB + MySQL (mixed) | Supabase (PostgreSQL) |
| Auth | JWT + bcrypt | Supabase Auth (email/password + Google OAuth) |
| User IDs | MongoDB ObjectIds / BIGINT | UUID (matching auth.users.id) |
| API Style | REST + some GraphQL | Pure REST |
| Validation | express-validator | Inline in services + Zod schemas |
| Error handling | Mixed (try/catch + express-validator) | Centralized error classes |
| Rate limiting | express-rate-limit | express-rate-limit (same) |
| CORS | cors middleware | cors middleware (same) |
| File uploads | multer | Not implemented in new backend |

### Endpoint Comparison

| Feature | Old Backend | New Backend | Compatible? |
|---------|------------|-------------|-------------|
| Register | POST /api/auth/register | POST /api/auth/register | ✅ Same |
| Login | POST /api/auth/login | POST /api/auth/login | ✅ Same |
| Google OAuth | POST /api/auth/google | POST /api/auth/google | ✅ Same |
| Get profile | GET /api/auth/me | GET /api/auth/me | ✅ Same |
| Drops | GET /api/drops | GET /api/drops | ✅ Same |
| Products | GET /api/products | GET /api/products | ✅ Same |
| Cart | POST /api/cart/add + more | POST /api/cart/items + more | ⚠️ Different paths |
| Orders | POST /api/orders/create | POST /api/orders | ⚠️ Different paths |
| Notifications | GET /api/notifications | GET /api/notifications | ✅ Same |
| Waitlist | POST /api/waitlist | POST /api/waitlist | ✅ Same |
| Admin drops | GET /api/admin/drops | POST /api/admin/drops + more | ⚠️ Different verbs |
| Admin products | Various | POST/PUT/DELETE /api/admin/products | ⚠️ Different |
| Admin orders | GET /api/admin/orders | GET/PUT /api/admin/orders | ⚠️ Different |
| Payments | POST /api/payments/verify | POST /api/admin/payments/verify | ⚠️ Moved under /admin |

---

## 4. Feature-by-Feature Migration

### Authentication

**Old:** `DropService.js` had `login()`, `register()`, `verifySession()`, `logout()`, `googleLogin()` making direct `fetch()` calls to the old backend.

**New:** All auth flows are identical in structure but the response format changed:
- Old: `{ success, token, user }`
- New: `{ success, access_token, refresh_token, user }`

**Action:** Rewrite `DropService.js` auth functions into `features/auth/api/authApi.ts`. ✅ Done.

### Drops

**Old:** `AdminApp.vue` + `AdminDropForm.vue` + `AdminDropList.vue` + `DropService.js`

**New:** Same business logic, different API paths. The backend now uses `status` field instead of `is_active`.

**Action:** 
- Reuse the drop form UX patterns (card layout, form validation)
- Rewrite API calls to match new endpoints
- Replace `is_active` references with `status` ✅ Done in backend

### Products

**Old:** `AdminProductForm.vue` + `DropService.js` product methods

**New:** Products now belong to drops via `drop_id` (was `dropId`). Products have `base_price` (was `price`). Products have `status` instead of `is_active`.

**Action:** Rewrite completely. ✅ Done in backend.

### Cart

**Old:** No cart module in old frontend (or very basic)

**New:** Full cart CRUD with stock validation, active drop validation, optimistic updates via React Query.

**Action:** Build from scratch. ✅ Done in new architecture.

### Orders

**Old:** Reservations page in admin (`AdminReservations.vue`)

**New:** Orders module with customer-facing order list + admin order management. Status flow: `pending_payment → paid → processing → shipped → completed / cancelled`.

**Action:** Build from scratch. ✅ Done in architecture.

### Notifications

**Old:** Notification bell in admin (`AdminApp.vue` lines 84-135)

**New:** Same bell pattern, but notifications API returns `description` field (not `message`). Backend has `unreadCount` endpoint.

**Action:** Rewrite API calls, keep UI pattern.

### Admin Panel

**Old:** Single-page Vue app with tabbed interface (drops, reservations, orders, settings, messages)

**New:** Multi-page React admin with sidebar navigation, separate pages for each entity.

**Action:** Completely redesign. ✅ Done in architecture.

---

## 5. What Can Be Reused

| Asset | Reusable? | How |
|-------|-----------|-----|
| Admin visual design (dark theme, blue accents) | ✅ | Extract design tokens → Tailwind config |
| Drop form UX (title, dates, status toggle) | ✅ | Rebuild as React component |
| Notification bell UX | ✅ | Rebuild as React component |
| Business rules (drop activation, stock logic) | ✅ | Already in backend |
| Image parsing logic | ✅ | Port `parseImage()` to `utils/format.ts` |
| Date formatting (`formatNoteDate`) | ✅ | Port to `utils/format.ts` |

---

## 6. What Must Be Rewritten

| Asset | Reason |
|-------|--------|
| All API service files | `DropService.js` calls old backend URLs and old response shapes |
| All Vue components | New app is React 19 |
| Auth flow | Old JWT auth ≠ new Supabase Auth flow |
| Router | No router in old frontend — HTML page-based |
| State management | No global state — add Zustand + React Query |
| Admin panel | Single-page Vue → multi-page React with sidebar |
| Cart page | Basic or non-existent — build full cart with optimistic updates |
| Checkout flow | Not implemented in old frontend |
| Customer pages | Not implemented in old frontend |

---

## 7. What Should Be Removed

| Asset | Reason |
|-------|--------|
| `frontend/src/admin/drops/` | Old Vue admin — incompatible |
| `frontend/src/components/` | Old Vue components — incompatible |
| `admin-portal/` | Separate old admin build |
| Root HTML files (`cart.html`, `product.html`, etc.) | Replaced by React Router |
| `index.html` at root | Old Vite entry — replaced by `frontend/index.html` |
| `oldserver.js` | Legacy Express server |
| `schema.sql`, `schema/` | Old MySQL schema |
| All `.html` files in root and `public/` | Replaced by SPA routing |

---

## 8. Migration Checklist

### Completed ✅

| Task | Status |
|------|--------|
| Project scaffold (package.json, tsconfig, vite, tailwind) | ✅ Done |
| Complete folder structure | ✅ Done |
| Axios client with interceptors | ✅ Done |
| Token refresh queue | ✅ Done |
| Global error handler | ✅ Done |
| Auth store (Zustand + persist) | ✅ Done |
| Cart store (Zustand) | ✅ Done |
| Notification store (Zustand) | ✅ Done |
| Auth context (React Query + Zustand bridge) | ✅ Done |
| Toast context | ✅ Done |
| App context (theme, locale) | ✅ Done |
| Route tree (public, customer, admin, guards) | ✅ Done |
| Error boundary | ✅ Done |
| All layout components | ✅ Done |
| Feature API shells (all 7 features) | ✅ Done |
| All TypeScript types | ✅ Done |
| All constants (api, roles, routes, enums) | ✅ Done |
| All utilities (cn, format, validators) | ✅ Done |
| All shared hooks | ✅ Done |
| Global CSS | ✅ Done |

### Remaining (UI Phase)

| Task | Priority |
|------|----------|
| Build UI components (Button, Input, Modal, Spinner, etc.) | High |
| Build feature components (ProductCard, CartItem, DropHero, etc.) | High |
| Build page content (HomePage, ShopPage, DropDetailPage, etc.) | High |
| Build admin pages (Dashboard, Drops, Products, Orders, Payments) | High |
| Implement cart optimistic updates | Medium |
| Implement checkout flow | Medium |
| Add image optimization component | Low |
| Add list virtualization for admin tables | Low |
| Add E2E tests | Medium |
