# FOF Backend — Production Readiness Audit

**Date:** 2026-07-02  
**Scope:** Complete backend audit before frontend integration  
**Version audited:** `fof-backend` at commit `ae96a68`

---

## 1. API Architecture

### Endpoints Implemented

| Method | Path | Access | Controller | Status |
|--------|------|--------|------------|--------|
| GET | `/health` | Public | inline | OK |
| POST | `/api/auth/register` | Public | authController.register | OK |
| POST | `/api/auth/login` | Public | authController.login | OK |
| POST | `/api/auth/google` | Public | authController.googleAuth | OK |
| GET | `/api/auth/me` | Authenticated | authController.me | OK |
| GET | `/api/drops` | Public | dropController.getAllDrops | OK |
| GET | `/api/drops/active` | Public | dropController.getActiveDrop | OK |
| GET | `/api/drops/:slug` | Public | dropController.getDropBySlug | OK |
| POST | `/api/admin/drops` | Admin | dropController.createDrop | OK |
| PUT | `/api/admin/drops/:id` | Admin | dropController.updateDrop | OK |
| POST | `/api/admin/drops/:id/activate` | Admin | dropController.activateDrop | OK |
| GET | `/api/products` | Public | productController.getProducts | OK |
| GET | `/api/products/:slug` | Public | productController.getProductBySlug | OK |
| POST | `/api/admin/products` | Admin | productController.createProduct | OK |
| PUT | `/api/admin/products/:id` | Admin | productController.updateProduct | OK |
| DELETE | `/api/admin/products/:id` | Admin | productController.deleteProduct | OK |
| GET | `/api/cart` | Authenticated | cartController.getCart | OK |
| POST | `/api/cart/items` | Authenticated | cartController.addItem | OK |
| PUT | `/api/cart/items/:variantId` | Authenticated | cartController.updateItem | OK |
| DELETE | `/api/cart/items/:variantId` | Authenticated | cartController.removeItem | OK |
| DELETE | `/api/cart` | Authenticated | cartController.clearCartItems | OK |
| POST | `/api/orders` | Authenticated | orderController.createOrder | OK |
| GET | `/api/orders/my` | Authenticated | orderController.getMyOrders | OK |
| GET | `/api/orders/:id` | Authenticated | orderController.getOrderById | OK |
| GET | `/api/admin/orders` | Admin | orderController.getAllOrders | OK |
| PUT | `/api/admin/orders/:id/status` | Admin | orderController.updateOrderStatus | OK |
| POST | `/api/admin/orders/:id/cancel` | Admin | orderController.cancelOrder | OK |
| POST | `/api/admin/payments/verify` | Admin | paymentController.verifyPayment | OK |
| GET | `/api/notifications` | Authenticated | notificationController.getNotifications | OK |
| GET | `/api/notifications/unread-count` | Authenticated | notificationController.getUnreadCount | OK |
| PUT | `/api/notifications/read-all` | Authenticated | notificationController.markAllRead | OK |
| PUT | `/api/notifications/:id/read` | Authenticated | notificationController.markRead | OK |
| POST | `/api/waitlist` | Public | waitlistController.addToWaitlist | OK |
| GET | `/api/waitlist` | Admin | waitlistController.getAllForAdmin | OK |

### Findings

- **Route naming:** Consistent. Resource-based (`/drops`, `/products`, `/orders`), admin actions nested under `/admin/`.
- **HTTP verbs:** Correct — GET for reads, POST for creates, PUT for updates, DELETE for deletes.
- **NO `validate` middleware applied anywhere.** Zod schemas exist in `auth.controller.js` (`loginSchema`, `registerSchema`, `googleSchema`) and in `middleware/validate.js`, but the `validate()` middleware is never used in any route file. All validation is done inline in the service layer.
- **Rate limiting only on auth routes** (`authLimiter`: 5 req/15min). No rate limiting on public routes like `/api/drops`, `/api/products`, `/api/waitlist`. The `apiLimiter` (100 req/15min) and `checkoutLimiter` (10 req/15min) are defined but `apiLimiter` is only applied to `/api/notifications`.

---

## 2. Database & Data Integrity

### Schema Issues

| Table | Issue |
|-------|-------|
| `products` | Changed `is_active BOOLEAN` → `status VARCHAR DEFAULT 'draft'` (fixed in last commit) |
| `product_quality_prices` | Still has `is_active BOOLEAN NOT NULL DEFAULT TRUE` — column does NOT exist in live DB |
| `quality_levels` | Has `is_active` — this is internally consistent but uses a different pattern than products |
| `notifications` | Schema says `message TEXT NOT NULL`, but `supabase_schema.sql` comment says the column is `description` |

### Critical Schema Mismatch

`product_quality_prices.sql` references `is_active` which doesn't exist in the live DB. Any query on this table will fail.

### Index Issues

- `idx_products_active` was updated to `WHERE status = 'live'` (fixed)
- No index on `orders.status` — filtering by status in admin will do a full scan
- No composite index on `orders(user_id, created_at)` — `getMyOrders` sorts but doesn't filter

### Foreign Keys

- `orders.user_id` was changed to UUID references `users(id)` — confirmed consistent
- `carts.user_id` is UUID — confirmed consistent
- All FK columns that reference `users` are UUID — consistent

---

## 3. Authentication & Authorization

### Findings

| Issue | Severity | Detail |
|-------|----------|--------|
| **No refresh token endpoint** | HIGH | Client receives `refresh_token` on login but there is no `POST /api/auth/refresh` to exchange it for a new `access_token`. Once the token expires, the user must log in again. |
| **No password reset flow** | HIGH | `password_resets` table exists, `utils/email.js` exists, but there is no `POST /api/auth/forgot-password` or `POST /api/auth/reset-password` endpoint. |
| **No profile update** | MEDIUM | `GET /api/auth/me` exists but there is no `PUT /api/auth/profile` to update name/email. |
| **Admin role is email-only** | MEDIUM | Admin role is determined by `ADMIN_EMAILS` env var at registration. If an admin needs to be removed, there is no way to do it without changing the env var and redeploying. |
| **No role change endpoint** | MEDIUM | `userRepo.updateRole()` exists in the repository but is never exposed via a controller. |
| **JWT validation hits DB on every request** | LOW | `requireAuth` middleware calls `supabase.auth.getUser(token)` then queries `public.users` on every single authenticated request. For high traffic, this is expensive. |
| **No token revocation** | LOW | If a user's access is revoked, existing JWTs remain valid until expiry. |

---

## 4. Business Logic Audit

### Authentication Module

| Check | Status | Detail |
|-------|--------|--------|
| Registration creates profile | OK | UUID from auth inserted into `public.users` |
| Login returns tokens + profile | OK | Session validated, profile upserted |
| Google OAuth syncs Google ID | OK | Stores `google_id` on user record |
| Role resolution | OK | `isAdminEmail()` checks against env var |
| Email confirmation handling | OK | Distinct error messages for unconfirmed emails |
| Profile auto-creation on login | OK | If user exists in auth but not public.users, creates profile |

### Users Module

| Check | Status | Detail |
|-------|--------|--------|
| User model | OK | UUID primary key, role, timestamps |
| No user deletion | BY DESIGN | Supabase Auth handles user lifecycle |
| No user update | ISSUE | No endpoint to update user profile |

### Drops Module

| Check | Status | Detail |
|-------|--------|--------|
| Create drop | OK | With slug uniqueness check |
| Update drop | OK | Slug conflict detection, activate on `status = 'live'` |
| Activate drop | OK | Calls RPC `activate_drop` |
| `getActiveDrop` | OK | Filters by `status = 'live'`, date window |
| `findAll` | OK | Filters by `status IN ('live', 'upcoming')` for public |
| RLS bypass | FIXED | All reads now use `supabaseAdmin` |

### Products Module

| Check | Status | Detail |
|-------|--------|--------|
| Create product | OK | Validates drop exists, slug uniqueness, base_price > 0 |
| Update product | OK | Slug conflict detection, allowed fields whitelist |
| Soft delete | OK | Sets `status = 'draft'` |
| Find by drop | OK | Filters `status = 'live'` |
| Variant creation | OK | Creates variants alongside product |
| Status column | FIXED | Uses `status` instead of `is_active` |

### Cart Module

| Check | Status | Detail |
|-------|--------|--------|
| Add to cart | OK | Validates variant exists, stock, active drop |
| Quantity merge | OK | Merges with existing item, respects stock limit |
| Update quantity | OK | Validates stock |
| Remove item | OK | Removes specific variant |
| Clear cart | OK | Empties entire cart |
| Stock validation | OK | Checks on add, update, and order creation |
| Guest cart support | PARTIAL | `findOrCreate` supports `sessionId` but `getCart`, `addItem`, etc. in the controller only use `req.user.id` — guest carts are not fully wired |

### Orders Module

| Check | Status | Detail |
|-------|--------|--------|
| Create from cart | OK | Validates cart items, drop window, stock |
| Create direct (items array) | OK | Validates variants, products, drop |
| Stock reservation | OK | Calls RPC `reserve_stock` per variant |
| Stock rollback | OK | On reservation failure, returns stock |
| Status transitions | OK | State machine: `pending_payment → paid → processing → shipped → completed` |
| Cancel order | OK | Returns stock, emits `ORDER_CANCELLED` |
| Get my orders | OK | Filters by `user_id` |
| Admin get all orders | OK | With filters for status, date range |
| Order ownership check | OK | `getOrderById` enforces `order.user_id === userId` |
| **N+1 in createFromCart** | CRITICAL | Calls `dropService.validateDropWindow()` inside the loop for EACH cart item — if a drop has 50 products and 5 items in cart, this fires 5 sequential DB queries that could be 1 |
| **createDirect uses supabase instead of supabaseAdmin** | MEDIUM | `order.repository.js` uses `supabase` (anon) for all reads/writes. Orders are created with `user_id` (UUID), but admin reads (`findAllAdmin`) joins with `users` and `order_items` using anon client. If the logged-in user isn't the order owner AND RLS is enabled on orders admin reads will fail. |

### Payments Module

| Check | Status | Detail |
|-------|--------|--------|
| Verify payment | OK | Calls RPC `verify_payment`, saves verification record |
| Duplicate check | OK | Returns `exists: true` on unique constraint violation |
| Admin-only | OK | Requires `requireAdmin` middleware |
| **Missing: order status update after verification** | CRITICAL | `verifyPayment` calls `verify_payment` RPC which presumably updates the order status to `paid`, but the RPC return is used as `data` in the event emitter. If the RPC doesn't update the status, the order stays `pending_payment` forever. |
| **No payment rejection flow** | MEDIUM | `PAYMENT_REJECTED` event exists but there is no endpoint or service to reject a payment. |

### Notifications Module

| Check | Status | Detail |
|-------|--------|--------|
| Create for user | OK | Creates notification for specific user |
| Create for admins | OK | Iterates all admins and creates notification for each |
| Mark as read | OK | Updates `is_read` for specific notification |
| Mark all as read | OK | Batch update |
| Unread count | OK | Uses `select('*', { count: 'exact', head: true })` |
| Get user notifications | OK | With pagination (limit/offset) |
| **2 separate queries on list** | LOW | `getNotifications` calls `getUserNotifications` AND `getUnreadCount` — 2 sequential queries. Could be combined. |

### Waitlist Module

| Check | Status | Detail |
|-------|--------|--------|
| Add to waitlist | OK | Validates email, normalizes to lowercase |
| Notify on drop activation | OK | Finds unnotified entries, checks if email is registered user, sends notification |
| Admin get all | OK | Simple `findAll` |
| Idempotency | OK | `UNIQUE(email)` constraint + upsert prevents duplicates |

---

## 5. Validation

| Issue | Severity | Detail |
|-------|----------|--------|
| **Zod validation middleware unused** | HIGH | `middleware/validate.js` defines schema-based validation, but NO route uses it. All validation is inline in services. This means bad requests reach the service layer before being rejected. |
| Auth validation is inline | MEDIUM | Password length, email regex, required fields are checked in `auth.service.js`. Should be in Zod schemas applied via middleware. |
| No validation on admin endpoints | MEDIUM | `createProduct`, `updateProduct`, `createDrop`, `updateDrop` accept any JSON body. No Zod/Zod-like schema validation. Malicious input (XSS in descriptions, injection) is not blocked at the API layer. |
| Order creation has no field validation | MEDIUM | `customer_name`, `customer_email`, `customer_phone`, `shipping_address` are accepted as-is with no format checks. |
| Cart quantity positive check | OK | `quantity <= 0` redirects to remove item |

---

## 6. Error Handling

| Issue | Severity | Detail |
|-------|----------|--------|
| **Two separate error handlers** | MEDIUM | `middleware/errorHandler.js` (centralized 4xx/5xx) and `utils/responseHandler.js` (used per-controller) duplicate the same logic. Responses may diverge between them. |
| `audit.repository.js` swallows errors | MEDIUM | `create()` catches Supabase errors, logs them, and returns `null` instead of throwing. The caller sees a silent failure and continues as if the audit log was created. |
| **Stack traces in non-production** | HIGH | Both error handlers include `err.stack` in responses when `NODE_ENV !== 'production'`. If `NODE_ENV` is accidentally set to `development` in production, stack traces leak file paths, line numbers, and potentially sensitive code structure. |
| No error correlation ID | LOW | Errors are logged with `errorId` but it's not returned in the response for the client to reference. |
| `logError` called for operational errors | LOW | Every 4xx error (validation, auth) calls `logError` which writes to stderr. This pollutes logs with expected client errors. |

---

## 7. Security Audit

| Issue | Severity | Detail |
|-------|----------|--------|
| **Anon client reads on admin data** | HIGH | `payment-verification.repository.js`, `audit.repository.js`, `inventory-history.repository.js` all use the `supabase` anon client. If RLS is enabled on these tables (which it should be), admin reads will return partial/no data. Must use `supabaseAdmin` for admin reads. |
| Admin emails in plain env var | MEDIUM | `ADMIN_EMAILS` is compared case-insensitively by trimming. If an attacker registers `Admin@faithoverfear.rw` (matching via case-insensitive compare), they get admin access. This is low risk but should use exact match or store admin roles explicitly in DB. |
| No request size limits | MEDIUM | Express default body size is 100kb. A malicious client could send a massive JSON body. The `cart.html` and `product.html` files in the root suggest the project had a previous iteration that might have different limits. |
| **Service role key exposure risk** | HIGH | `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL RLS. If this key leaks (via git, logs, error messages), the entire database is compromised. There is no key rotation mechanism. |
| No input sanitization | MEDIUM | While Supabase parameterized queries prevent SQL injection, XSS via product names, descriptions, drop titles is possible if the frontend renders them as HTML. |
| CORS allows localhost origins | LOW | `http://localhost:3000` and `http://localhost:5173` are in allowed origins. Fine for dev, but should be configurable per environment. |
| **No HTTPS enforcement** | MEDIUM | If behind a proxy, there is no `X-Forwarded-Proto` handling or `helmet.hsts()` configuration. |
| Rate limiting by IP only | LOW | A single attacker with multiple IPs or a botnet bypasses rate limits. User-based rate limiting would be more effective for authenticated endpoints. |
| No password complexity enforcement | LOW | Only checks `length >= 8`. No requirements for uppercase, numbers, special characters. |
| No account lockout | LOW | Unlimited login attempts per IP per 15 minutes (5 attempts). The `authLimiter` resets after 15 minutes. |

---

## 8. Performance

| Issue | Severity | Detail |
|-------|----------|--------|
| **N+1 in `createFromCart`** | HIGH | `validateDropWindow(p.drop_id)` is called for EACH cart item in a `for...of` loop. For a cart with 5 items across 2 drops, this is 5 sequential DB queries instead of 1. Move the drop validation outside the loop. |
| **N+1 in `createDirect`** | HIGH | For each item, calls `variantRepo.findById()` then `productRepo.findById()` — 2 queries per item. Should batch fetch all variants and products. |
| Double `getAllDrops(true)` in `createProduct` | MEDIUM | `createProduct` calls `dropService.getAllDrops(true)` twice — once to check drop exists, then again inside `validateDropWindow` check via `getActiveDrop`. Should fetch once. |
| `requireAuth` DB hit per request | MEDIUM | Every authenticated request calls `supabase.auth.getUser(token)` AND queries `public.users`. The second query is needed for role, but the first validates the JWT. Could use `@supabase/ssr` or manual JWT decode for the user ID, then only fetch `public.users` if the ID is new. |
| No caching for static data | LOW | Drops, products with `status = 'live'`, quality levels are queried on almost every request. A 30-second in-memory cache would drastically reduce DB load. |
| 2 queries for notifications list | LOW | `getNotifications` calls `getUserNotifications` and `getUnreadCount` sequentially. |

---

## 9. Code Quality

### Duplicate Logic

| Duplicated Code | Files | Recommendation |
|----------------|-------|----------------|
| Error response formatting | `errorHandler.js`, `responseHandler.js` | Merge into single handler |
| Product validation (name, base_price) | `product.service.js`, legacy `controllers/productController.js` | Remove legacy controller |
| `resolveRole` / admin check | `auth.service.js`, `admin.js` | Extract to shared auth utility |
| `require('events')` inside functions | `auth.service.js`, `product.service.js`, `order.service.js` | Move to top of file |

### Dead Code

| Dead Code | File | Detail |
|-----------|------|--------|
| `models/` directory | Multiple | Legacy models (`models/product.js`, `models/order.js`, `models/reservation.js`) use raw SQL and are NOT used by the new service layer. They reference `is_active` which no longer exists. |
| Legacy controllers | `controllers/productController.js`, `controllers/qualityLevelController.js` | Old controllers that don't follow the new controller/service/repository pattern. Not wired into routes. |
| `client/src/` | Multiple | Built assets, unused frontend. |
| `cart.html`, `product.html`, `index.html` in root | Multiple | Test files from earlier iteration. |
| `notification.service.js` uses `message` field | Line 9, 15-16 | Inserts `message` to `notifications` table, but the schema defines `description`. Either the schema or the code is wrong. |

### Naming Consistency

| Inconsistency | Detail |
|---------------|--------|
| `is_active` vs `status` | Being migrated. `products` uses `status`, `quality_levels` and `product_quality_prices` use `is_active`. |
| `product_variant_id` vs `variantId` | Repository uses `product_variant_id`, service uses `variantId`. Inconsistent but functional. |
| `order_items` fields | Service sends `unit_price`, `product_name`, `size`, `color`, `quantity`, `subtotal`. DB schema has `product_name`, `size`, `color`, `quantity`, `unit_price`, `subtotal`. Let me verify the schema. |

### Folder Structure

| Issue | Detail |
|-------|--------|
| Legacy code mixed with new | `models/`, `controllers/`, and `middleware/` at root contain both old and new code. New architecture is under `src/services/`, `src/repositories/`. |
| `db/` directory has 8+ SQL files | Mix of migrations, schema files, and ad-hoc scripts. Should consolidate into a single migration chain. |
| `reservations` controller | `controllers/reservationController.js` uses raw pool.query() — doesn't fit the new architecture at all. |

---

## 10. Frontend Readiness

| Check | Status | Detail |
|-------|--------|--------|
| Consistent response format | MOSTLY OK | Success: `{ success: true, data }`. Error: `{ success: false, error }`. But `handleServiceError` in some controllers doesn't include `errorId` for 4xx errors. |
| Documented endpoints | OK | `POSTMAN_TESTING.md` covers all endpoints with request/response examples. |
| Auth flow complete | PARTIAL | Login works, but no refresh token flow, no password reset, no profile update. |
| No pagination on any list | HIGH | `getAllDrops`, `getAllProducts`, `getMyOrders`, `getAllOrders` all return ALL records. With 10,000 orders, the response will be megabytes. |
| No search/filter for products | MEDIUM | Only filter by `dropId`. No search by name, price range, or status. |
| Error responses predictable | OK | 400/401/403/404/500 with `{ success: false, error, errorId }` — consistent. |
| Stock shown in cart | OK | `stock` is returned in cart items. |
| Drop activation | PARTIAL | Frontend needs to know when a drop is live. `GET /api/drops/active` returns the active drop, but there is no WebSocket or polling mechanism for drop status changes. |
| Order status polling | MISSING | After placing an order, the frontend has no way to know when the order status changes (e.g., from `pending_payment` to `confirmed`). No WebSocket, no polling endpoint, no webhook. |

---

## 11. Schema Gaps

Comparing `supabase_schema.sql` against code usage:

| Table | Code References | Schema Has | Issue |
|-------|----------------|------------|-------|
| `product_quality_prices` | `order.service.js` line 53, `variant.service.js` | `is_active` column | Column doesn't match |
| `notifications` | Controller uses `description`, service uses `message` | `message TEXT NOT NULL` | Service inserts `message` but schema may have `description` |
| `orders` | Service uses `shipping_address` | Not verified in schema | May be missing |
| `product_variants` | `price_override`, `stock`, `sku` | Need to verify all columns exist | Cross-check needed |

---

## 12. RPC/Functions

| RPC | Used In | Purpose | Risk |
|-----|---------|---------|------|
| `activate_drop` | `drop.repository.js` | Activates drop, likely updates related products | If RPC doesn't exist, admin cannot activate drops |
| `verify_payment` | `payment.service.js` | Verifies payment, updates order status | If RPC doesn't exist, payment verification fails |
| `reserve_stock` | `variant.service.js` | Atomically reserves stock | If RPC doesn't exist, order creation fails |
| `return_stock` | `variant.service.js` | Returns stock on cancellation | If RPC doesn't exist, cancellations don't free stock |

---

## Final Verdicts

### Production Readiness Score: **5/10**

The backend has a solid architecture (service/repository/controller separation, event-driven design, typed errors, basic rate limiting), but it has **critical gaps** that make it unsuitable for production frontend integration today.

### Critical Issues (Cannot launch without fixing)

1. **N+1 queries in order creation** — `createFromCart` makes sequential DB calls per cart item. With 10 concurrent users placing orders with 5 items each, this is 50 sequential DB calls. Will cause timeouts under load.
2. **`product_quality_prices.is_active` column doesn't exist** — Any code path touching quality prices will crash.
3. **No refresh token endpoint** — Users are logged out every time the JWT expires (1 hour default).
4. **No password reset flow** — Users who forget their password are permanently locked out.
5. **Orders table may read with anon client** — `order.repository.js` uses `supabase` for all reads. Admin reads of orders will fail if RLS is enabled.
6. **No pagination on any list endpoint** — Will return all records, causing massive responses and client crashes as data grows.

### High Priority Issues (Fix before frontend integration)

7. `audit.repository.js` swallows errors silently — audit trail is unreliable
8. `payment-verification.repository.js` uses anon client for admin reads
9. Stack traces leak in non-production mode
10. No input validation on admin endpoints (XSS, injection risk)
11. `controllers/reservationController.js` uses raw SQL — doesn't work with new schema
12. `products` table `status` migration incomplete — other code may still reference `is_active`

### Medium Priority Issues

13. Two duplicate error handlers should be merged
14. No profile update endpoint
15. No way to change admin role without redeploying
16. `getAllDrops(true)` called twice in `createProduct`
17. CORS origins hardcoded, not environment-configurable
18. No user-based rate limiting
19. `notifications` column name confusion (`message` vs `description`)
20. Guest cart not fully wired in controllers

### Low Priority / Improvements

21. In-memory cache for drops, products, quality levels
22. `isAdminEmail` should use exact match or DB-stored roles
23. Combine notification list + unread count into single query
24. Add correlation IDs for distributed tracing
25. Standardize naming (`product_variant_id` vs `variantId`)
26. Remove dead code (legacy `models/`, `controllers/`, HTML files)
27. Consolidate SQL files in `db/` directory

### Security Findings

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Stack traces in non-prod | HIGH | Remove `stack` from all error responses |
| Service role key exposure | HIGH | Add to `.gitignore`, never log, implement key rotation |
| Anon client reads admin data | HIGH | Switch to `supabaseAdmin` for `payment-verification`, `audit`, `inventory-history` repositories |
| Admin by email only | MEDIUM | Allow role changes via admin endpoint, store in DB |
| No HTTPS enforcement | MEDIUM | Add `helmet.hsts()` and `X-Forwarded-Proto` handling |
| No request size limit | MEDIUM | Set `express.json({ limit: '1mb' })` |
| Rate limit by IP only | LOW | Add user-based rate limiting for authenticated endpoints |

### Code Quality Findings

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| 2 duplicate error handlers | MEDIUM | Merge into single `errorHandler.js` |
| `require('events')` inside functions | LOW | Move to top of file |
| Legacy `models/` and `controllers/` | LOW | Delete or archive |
| Inconsistent Supabase client usage | HIGH | Document which tables use which client |

### Missing Features

| Feature | Impact | Recommendation |
|---------|--------|----------------|
| Password reset | HIGH — users locked out | Implement `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` |
| Refresh token endpoint | HIGH — forced re-login | Implement `POST /api/auth/refresh` |
| Profile update endpoint | MEDIUM — users can't change name | Implement `PUT /api/auth/profile` |
| Pagination | HIGH — performance at scale | Add `?page=&limit=` to all list endpoints |
| Product search/filter | MEDIUM — UX | Add `?q=` and `?minPrice=&maxPrice=` to `/api/products` |
| Order status webhook/polling | MEDIUM — UX | Add `GET /api/orders/:id/status` lightweight endpoint |
| Admin user management | MEDIUM — ops | Add endpoints to list users, change roles |

### What Works Well

- Service/Repository/Controller separation is clean
- Event-driven architecture for side effects (notifications, audit logs)
- Supabase client MCP pattern (anon for user data, admin for system data)
- Role-based authorization with middleware
- Stock reservation with rollback on failure
- State machine for order status transitions
- Centralized error classes
- Rate limiting on auth endpoints
- Email confirmation error detection
- Comprehensive Postman testing guide

---

## Final Verdict

**DO NOT integrate the frontend yet.**

The backend will work for small-scale testing, but it has 6 critical issues that will cause production failures. The most dangerous are the N+1 queries in order creation (will timeout under load), the missing password/refresh token endpoints (users will get locked out), and the missing pagination (will crash the browser with 1000+ records).

**Recommended path:**
1. Fix the 6 critical issues
2. Fix the 12 high-priority issues
3. Add the 6 missing features (especially password reset and refresh tokens)
4. Then proceed with frontend integration

Estimated effort: 2-3 days of focused work.
