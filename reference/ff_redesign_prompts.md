# Claude Code Prompts: Apply the 3D Redesign to the Real F>F Website

Paste these ONE AT A TIME into Claude Code, in the project folder of the live site (faithoverfearrw). Do not paste the next part until the previous one is finished and you have approved it.

Before you start, put these three files in a `reference/` folder inside the project:
- `ff_3d_site.html` (the working demo, open it in a browser to see the target design)
- `ff_reference_code.md` (the CSS and 3D code from the demo)
- this prompt file

---

## RULES FOR EVERY PART (read these first, they apply to all four parts)

1. **Functionality must stay exactly the same.** Every feature that works today must still work the same way: browsing, product pages, sizes and quantity, cart, checkout and MoMo payment, login and signup, forgot password, contact form, delivery page, and anything else the site does. I may change design, layout and content. I may NOT lose or break any function.
2. **Do not touch** the backend, database, API calls, auth logic, payment logic, environment variables, or stored data keys (for example cart storage keys). If something in the design needs a change there, stop and ask me.
3. **If a page address (URL) must change**, keep the old address working with a permanent forward (a "301 redirect", which sends visitors and Google from the old address to the new one). On Netlify this goes in `_redirects` or `netlify.toml`. Update every internal link on the whole site to the new address. Keep query strings like `product.html?id=...` working.
4. **Changes apply to the whole site, not only the home page.** Use one shared header, footer and menu so every page gets them.
5. **Keep every ID, class, name and data-attribute that any script depends on.** If you must rename one, update the scripts too and test.
6. **The site must feel smooth, not slow.** See the performance rules in Part 3. Measure speed before and after and tell me both numbers.
7. **Investigate first, report, then wait for my approval before changing code** (this is how Part 1 works, and each later part must show a short plan before editing).
8. Keep the copy and tone of the site. Do not invent product names, prices or policies. If content is missing, leave a clearly marked placeholder and list it for me.

---

## PART 1: Investigate and write the Functionality Contract (NO code changes)

Read the whole project and report back. Do not edit anything.

1. **Stack:** plain HTML, or a framework? How is it built and deployed (Netlify settings, functions, redirects)?
2. **Every page and its URL pattern**, and which files make each page.
3. **Every script** and what it does. List every API or database call (for example Supabase), every form and its handler, how login and sessions work, how the cart is stored, and how the MoMo payment flow works end to end.
4. **Functionality Contract:** a numbered checklist of every user action and its expected result, for example "add Classic Crest size M to cart, cart count updates, cart page shows it, quantity can change, remove works, checkout starts MoMo". Also list every element ID, class, name or data-attribute that scripts rely on.
5. **Speed baseline:** page weight, biggest images, number of scripts, and Lighthouse mobile scores for home, shop and product pages if you can run them.
6. **Plan:** where the shared header, footer and menu would go; which URLs (if any) you'd change and the redirects needed; how the 3D home hero would get the real products and images; the risks.

Stop and wait for my approval.

---

## PART 2: Shared layout, design system and navigation (after I approve Part 1)

Target design: the demo in `reference/ff_3d_site.html`. Use Appendix A in `ff_reference_code.md`.

1. Build **one shared header, footer and mobile menu** used by every page, so changes apply sitewide (use the stack's own way: a template partial, a layout file, or one shared include).
2. **Header:** a fixed left navigation on desktop with the links stacked as normal horizontal text (New arrivals, Lookbook, About, Contact, Delivery, Login), the F>F logo at the top, and the cart with a live item count at the top right. Use the real links and the real cart count logic already on the site.
3. **Mobile (up to 760px):** the left nav becomes a slim top bar with a Menu button that opens a full-screen menu, with Close, large links, and the cart count still visible. Use safe-area padding so nothing hides under notches.
4. Apply the colour tokens (light and dark), type (Anton for display, Instrument Sans for body), spacing and button styles from Appendix A to ALL pages: shop, product, about, contact, delivery and returns, login, cart, lookbook.
5. Add the short page entrance animation (`pin`) to page content, with `prefers-reduced-motion` turned off.
6. Follow Rules 1 to 5 above. After editing, walk through the Functionality Contract for every page and report pass or fail for each item.

Show me a short plan first, then wait for my approval before editing.

---

## PART 3: The 3D home hero and smoothness (after I approve Part 2)

Use Appendix B in `ff_reference_code.md`.

1. Add the rotating 3D ring of products at the top of the home page (Three.js). Build it from the **real products and their real image URLs** (newest first; repeat them if there are fewer than 9). Set `crossOrigin = "anonymous"` on the texture loader so images from another domain load. Clicking a piece goes to that product's real page. Hovering shows its real name and price.
2. Keep the big ABIDE headline and "Shop Abide" button from the demo, using the real current drop name and the real shop link. The rest of the home page (drop grid and anything else the home page does today) stays.
3. **Performance rules (required):**
   - Load Three.js only on the home page, after the first paint (use `requestIdleCallback` or a short timeout), from a pinned version (for example cdnjs three.js 0.128.0 or a version at least two weeks old). Never load it on other pages.
   - Cap pixel ratio at 2 (1.5 on phones). Use one draw loop, and pause it when the hero is off screen (`IntersectionObserver`) or the tab is hidden (`visibilitychange`).
   - Resize product images for the 3D ring to about 512px, WebP, and reuse the same texture for repeated pieces.
   - Dispose of textures and geometry if the user leaves the home page.
   - Fallback to a plain static grid (same links) when WebGL is not available, `prefers-reduced-motion` is on, data saver is on, or the device is low-end (`navigator.hardwareConcurrency <= 4` or `navigator.deviceMemory <= 4`).
   - Animate only `transform` and `opacity`. Use passive scroll listeners. Avoid heavy blur or large shadows.
   - Fonts: `preconnect` plus `font-display: swap`. Images: `width` and `height` set, `loading="lazy"` and `decoding="async"` below the fold.
4. Re-run the Functionality Contract for home and every page. Report speed before and after.

Show me a short plan first, then wait for my approval before editing.

---

## PART 4: Product page 3D, card tilt and final QA (after I approve Part 3)

Use Appendix C in `ff_reference_code.md`.

1. Add the tilt effect to product cards (grid and lookbook) and to the main image on the product page. Only on devices with a mouse or trackpad (`(hover: hover)`), not on touch screens. Transform-only, no layout shifts, and off for reduced motion.
2. Make sure the product page keeps every control working: colour, size, quality, quantity, add to cart, pay with MoMo, image thumbnails, and anything else it does today.
3. **Final QA, and report each result:**
   - Every item in the Functionality Contract: pass or fail.
   - Test at 360px and 390px wide (phones) and a desktop width. No sideways scrolling anywhere.
   - Keyboard: every link and button reachable, visible focus, the mobile menu closes with Close and with the link tap.
   - All old URLs: open each one and confirm it works or forwards correctly.
   - Lighthouse mobile: performance, accessibility and SEO before vs after.
   - A list of every file changed, every redirect added, and any placeholder content I need to fill in.
4. If any pass-or-fail item fails, fix it before reporting done.
