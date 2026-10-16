# Functionality Contract — Faith Over Fear website

Generated during PART 1 investigation. Applies to every page group checked during PART 2+ restyle. Each item: pass/fail per page.

## Script-dependent element IDs, classes, names, data-attributes (do not remove or rename without updating JS)

| Element | ID / class / attribute | Used by |
|---|---|---|
| Body | `x-data="shopLogic()"`, `x-init="init()"`, `@scroll.window`, `:class="{ 'scrolled': scrolled }"` | shop.js |
| Cart storage | localStorage key `fof_cart` | shop.js |
| Cart count UI | updated by Alpine `cartItems` (header cart link) | shop.js |
| Menu toggle | `id="menu-toggle"` (checkbox) | CSS only (header partial) |
| Primary nav | `id="primary-nav"` (nav) | CSS only (header partial) |
| Logo | `class="logo"` | header partial |
| Nav list | `class="nav-list"` | header partial |
| CTA cart | `class="cta"` | header partial |
| Hero bag | `id="hero-bag"` | animations.js (guarded: `if (!r) return;`) |
| Notification root | `class="notification"` | shop.js notify events |
| Announcement root | `id="announcement-root"` | shop.js |
| Auth modal | `id="auth-modal"` | shop.js |
| Reservation modal | `id="reservation-modal"` | shop.js |
| Contact form fields | `contactName`, `contactEmail`, `contactPhone`, `contactSubject`, `contactMessage` | shop.js submitContact → `/api/contact` |
| MoMo modal | payment flow via WhatsApp `wa.me/250781718450` | shop.js |
| Reservations | localStorage keys `fof_token`, `fof_user`, `fof_session_id` | shop.js |

## Functionality Contract (numbered checklist)

### Browse & navigation
1. Home page loads; hero, drops grid, featured content render.
2. Clicking a nav link (Home, New Arrivals, Lookbook, About, Contact) opens the correct page.
3. `aria-current="page"` is set on the active nav link for each page.
4. Footer links (Home, Shop New Arrivals, Lookbook, About, Contact, FAQ, Deliveries & Returns, Terms) resolve to correct pages.
5. Social links (Instagram, TikTok, Email) open in new tab / mailto.
6. Auth pages (login, signup, forgot-password, reset-password) are structurally untouched and still load.

### Shop / product pages
7. Shop page loads product grid; products render with name, price, image.
8. Product page loads via `?id=` query param; correct product displays.
9. Product controls work: colour, size, quality, quantity selectors.
10. Add to cart updates cart count and persists to `fof_cart` localStorage.
11. Cart page shows cart contents; quantity can change; remove works.
12. Cart total computes correctly (items without price not counted).
13. Product image thumbnails switch main image.

### Cart / checkout (MoMo)
14. Cart "Pay with MoMo" opens WhatsApp `wa.me/250781718450` with order text; cart clears after order.
15. Cart copy-to-clipboard works.
16. Manual payment verification flow (WhatsApp message) works.

### Auth
17. Login form submits; on success stores `fof_token`/`fof_user`; on failure shows error.
18. Signup form submits; creates account; redirects/login.
19. Forgot password sends reset email.
20. Reset password sets new password; redirects to login.
21. Logout clears `fof_token`/`fof_user` and reloads.
22. Reservation requires login; shows "Please login or sign up before reserving" otherwise.

### Contact form
23. Contact form submits to `/api/contact` with `{name, email, phone, subject, message}`.
24. Success message shows; form fields clear.
25. Error message shows on failure.

### Delivery & returns
26. Shipping page loads; delivery days (Wednesday/Sunday) and returns policy text display.

### Performance & accessibility
27. Build succeeds (`npm run build`); all 14 pages emit to `dist/`.
28. No remaining `@@HEADER`/`@@FOOTER` markers in dist HTML.
29. No sideways scrolling at 360px, 390px, and desktop widths.
30. Every link and button keyboard-reachable; visible focus.
31. Mobile menu opens/closes via checkbox; no JS toggle required.
32. `prefers-reduced-motion: reduce` disables entrance animation and card/pimg transitions.

## Pages in scope

Shared (10): index, shop, lookbook, product, cart, contact, about, shipping, faq, terms
Auth (4, untouched structurally): login, signup, forgot-password, reset-password
