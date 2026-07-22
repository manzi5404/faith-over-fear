# Faith Over Fear — Frontend Architecture

## Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 5** — build tool + dev server
- **React Router v6** — routing
- **React Query v5** — server state (caching, mutations, refetch)
- **Zustand** — client state (auth, cart badge, theme)
- **Tailwind CSS v3** — styling
- **Axios** — HTTP client
- **React Hook Form** + **Zod** — form state + validation

---

## 1. Project Folder Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .env
├── .gitignore
│
├── public/
│   ├── favicon.ico
│   ├── fonts/
│   └── images/
│       ├── products/
│       ├── drops/
│       ├── hero/
│       └── og/
│
└── src/
    ├── main.tsx                    # React entry point
    ├── App.tsx                     # Root shell: providers + router
    │
    ├── app/
    │   ├── providers.tsx           # Root provider stack
    │   └── router.tsx              # Route tree (lazy-loaded)
    │
    ├── layouts/
    │   ├── PublicLayout.tsx        # Header (no cart) + Footer
    │   ├── CustomerLayout.tsx      # Header (cart icon) + Footer
    │   └── AdminLayout.tsx         # Sidebar + top bar
    │
    ├── pages/
    │   ├── public/
    │   │   ├── HomePage.tsx
    │   │   ├── DropsPage.tsx
    │   │   ├── DropDetailPage.tsx
    │   │   ├── ProductsPage.tsx
    │   │   ├── ProductDetailPage.tsx
    │   │   ├── CartPage.tsx
    │   │   ├── CheckoutPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── WaitlistPage.tsx
    │   │   └── NotFoundPage.tsx
    │   ├── customer/
    │   │   ├── CustomerDashboard.tsx
    │   │   ├── CustomerOrdersPage.tsx
    │   │   ├── CustomerOrderDetailPage.tsx
    │   │   └── CustomerProfilePage.tsx
    │   └── admin/
    │       ├── AdminDashboard.tsx
    │       ├── AdminDropsPage.tsx
    │       ├── AdminProductsPage.tsx
    │       ├── AdminOrdersPage.tsx
    │       ├── AdminPaymentsPage.tsx
    │       └── AdminWaitlistPage.tsx
    │
    ├── features/                   # Self-contained business modules
    │   ├── auth/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── stores/
    │   │   ├── types/
    │   │   └── index.ts
    │   ├── drops/
    │   ├── products/
    │   ├── cart/
    │   ├── checkout/
    │   ├── orders/
    │   ├── notifications/
    │   ├── user/
    │   ├── admin/
    │   └── waitlist/
    │
    ├── shared/                     # Cross-cutting utilities and primitives
    │   ├── components/
    │   │   ├── ui/                 # Button, Input, Modal, Spinner, Badge, EmptyState
    │   │   ├── layout/             # Header, Footer, Container, MobileNav
    │   │   └── forms/              # FormField, Select
    │   ├── hooks/                  # useDebounce, useMediaQuery, useLocalStorage
    │   ├── utils/                  # cn(), format.ts, validators.ts
    │   └── types/                  # common.types.ts
    │
    ├── services/                   # Infrastructure — never import from features
    │   ├── api/
    │   │   ├── client.ts           # Axios instance + interceptors
    │   │   ├── auth.ts             # Header injection
    │   │   ├── refresh.ts          # Token refresh queue
    │   │   └── errorHandler.ts     # Normalize API errors
    │   ├── query/
    │   │   ├── queryClient.ts      # React Query client config
    │   │   └── queryKeys.ts        # Centralized key factory
    │   └── storage/
    │       └── tokenStorage.ts     # localStorage read/write
    │
    ├── stores/                     # Zustand stores
    │   ├── authStore.ts
    │   ├── cartStore.ts
    │   └── notificationStore.ts
    │
    ├── contexts/                   # React Contexts (UI-only, low-frequency updates)
    │   ├── AppContext.tsx          # Theme, locale
    │   └── ToastContext.tsx        # Toasts
    │
    ├── constants/
    │   ├── api.ts                  # Endpoints, timeouts, retry config
    │   ├── roles.ts                # ADMIN, CUSTOMER
    │   ├── routes.ts               # Path constants
    │   └── enums.ts                # Order statuses, drop statuses
    │
    ├── types/
    │   ├── api.types.ts
    │   ├── auth.types.ts
    │   ├── drops.types.ts
    │   ├── products.types.ts
    │   ├── cart.types.ts
    │   ├── orders.types.ts
    │   └── index.ts                # Barrel export
    │
    ├── styles/
    │   ├── globals.css             # Tailwind + resets
    │   └── themes/
    │       ├── light.css
    │       └── dark.css
    │
    └── assets/                     # Inline static assets
        ├── images/
        ├── fonts/
        └── icons/
```

### Responsibility of Each Folder

| Folder | Owns | Must NOT touch |
|--------|------|----------------|
| `app/` | Shell wiring, providers, router tree | Business logic |
| `layouts/` | Page chrome that wraps features | Feature internals |
| `pages/` | Thin route shells that compose features | Shared utilities |
| `features/` | Everything for one business module | Other features' code |
| `shared/` | Reusable primitives used across features | Feature-specific logic |
| `services/` | HTTP client, query client, storage — infrastructure only | UI |
| `stores/` | Zustand stores for cross-cutting client state | Feature-scoped state |
| `contexts/` | React Contexts for ephemeral UI state | Server data |
| `constants/` | Shared enums, route strings, API constants | Feature constants |
| `types/` | Shared TypeScript types | Feature-internal types |

---

## 2. Feature-Based Organization

Each feature is a self-contained directory:

```
features/auth/
├── api/authApi.ts               # HTTP calls: login, register, refresh, me
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   └── useAuth.ts               # React Query hooks for auth
├── stores/
│   └── authStore.ts             # Zustand: user, token, role
├── types/
│   └── auth.types.ts
└── index.ts                     # Public exports only
```

### Feature Isolation Rules

1. **No imports across features.** `features/cart` cannot import from `features/orders`.
2. **Shared code goes in `shared/`.** If two features need the same thing, extract it.
3. **Each feature owns its API functions and React Query hooks.**
4. **Each feature exports an `index.ts`** — the only legal import point from outside.
5. **Pages compose features** — a page is a thin shell that imports from multiple features.

### Why This Matters

When a developer needs to change cart behavior, they only touch `features/cart/`. They don't accidentally break orders, products, or notifications.

---

## 3. Routing Architecture

### Route Tree

```tsx
<Routes>
  {/* ── Public ── */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/shop" element={<ProductsPage />} />
    <Route path="/drops" element={<DropsPage />} />
    <Route path="/drops/:slug" element={<DropDetailPage />} />
    <Route path="/products/:slug" element={<ProductDetailPage />} />
    <Route path="/waitlist" element={<WaitlistPage />} />
    <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />

    {/* Auth pages — redirect if already logged in */}
    <Route element={<RequireGuest />}>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    </Route>
  </Route>

  {/* ── Customer ── */}
  <Route element={<RequireAuth roles={[CUSTOMER]}><CustomerLayout /></RequireAuth>}>
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
    <Route path="/customer/orders" element={<CustomerOrdersPage />} />
    <Route path="/customer/orders/:id" element={<CustomerOrderDetailPage />} />
    <Route path="/customer/profile" element={<CustomerProfilePage />} />
  </Route>

  {/* ── Admin (separate bundle) ── */}
  <Route element={<RequireAuth roles={[ADMIN]}><AdminLayout /></RequireAuth>}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/drops" element={<AdminDropsPage />} />
    <Route path="/admin/products" element={<AdminProductsPage />} />
    <Route path="/admin/orders" element={<AdminOrdersPage />} />
    <Route path="/admin/payments" element={<AdminPaymentsPage />} />
    <Route path="/admin/waitlist" element={<AdminWaitlistPage />} />
  </Route>

  {/* ── Errors ── */}
  <Route path="/unauthorized" element={<UnauthorizedPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Route Guards

| Guard | Behavior |
|-------|----------|
| `RequireAuth` | If no token → redirect to `/auth/login`. If wrong role → redirect to `/unauthorized`. |
| `RequireGuest` | If token exists → redirect to `/shop` (already logged in). |
| `AdminOnly` | If role is not `admin` → redirect to `/unauthorized`. |

All guards check both `localStorage` token and Zustand state. On mismatch, they sync from `localStorage`.

### Lazy Loading

Every route is lazy-loaded. Admin pages split into a separate chunk:

```tsx
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProductsPage'));
```

This keeps the initial customer bundle small (admin code never loads for customers).

---

## 4. State Management

### Decision Matrix

| Tool | Used For | Reason |
|------|----------|--------|
| **React Query** | All server data (drops, products, orders, notifications) | Caching, background refetch, mutations, devtools. This is 90% of app state. |
| **Zustand** | Client state needed across the app (auth token, cart count, theme) | Minimal, no boilerplate, works outside React (axios interceptors). |
| **React Context** | Ephemeral UI state (toasts, modals, form steps) | Fine for low-frequency updates. |

### React Query — Server State

```tsx
// features/drops/hooks/useDrops.ts
export function useActiveDrop() {
  return useQuery({
    queryKey: queryKeys.drops.active,
    queryFn: dropsApi.getActive,
    staleTime: 30_000,
  });
}

// features/cart/hooks/useCart.ts
export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart.me,
    queryFn: cartApi.get,
    staleTime: 0, // always fresh
  });
}
```

### Zustand — Auth Store

```tsx
interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  role: null,
  setAuth: (user, token) => {
    set({ user, token, role: user.role });
    localStorage.setItem('access_token', token);
  },
  logout: () => {
    set({ user: null, token: null, role: null });
    localStorage.removeItem('access_token');
  },
}));
```

Zustand is necessary because the axios interceptor runs outside React — it needs access to the token.

### Context — Toasts

```tsx
// contexts/ToastContext.tsx
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}
```

---

## 5. API Layer

### Principle

**No component or page calls Axios directly.** Every request goes through:

```
Component → React Query hook → Feature API → Global API Client → Axios → Backend
```

### Axios Instance

```ts
// services/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { handleApiError } from './errorHandler';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10_000,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // All 401s go through refresh queue
    if (error.response?.status === 401) {
      return handleUnauthorized(error);
    }
    return Promise.reject(handleApiError(error));
  }
);
```

### Token Refresh Strategy

On 401, queue the failed request, refresh the token, then retry:

```ts
// services/api/refresh.ts
let isRefreshing = false;
let pendingQueue: Array<{ resolve: () => void; reject: () => void }> = [];

async function handleUnauthorized(error: AxiosError) {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    }).then(() => apiClient(error.config!)).catch(() => Promise.reject(error));
  }

  isRefreshing = true;
  try {
    const refreshToken = useAuthStore.getState().token;
    const { data } = await axios.post(
      `${apiClient.defaults.baseURL}/api/auth/refresh`,
      { refresh_token: refreshToken }
    );
    useAuthStore.getState().setAuth(data.user, data.access_token);

    // Retry all queued requests
    pendingQueue.forEach(({ resolve }) => resolve());
    pendingQueue = [];

    return apiClient(error.config!);
  } catch (refreshError) {
    useAuthStore.getState().logout();
    window.location.href = '/auth/login';
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}
```

### Feature API Layer

```ts
// features/cart/api/cartApi.ts
import { apiClient } from '@/services/api/client';
import type { Cart, CartItem } from '../types/cart.types';

export const cartApi = {
  get: (): Promise<Cart> =>
    apiClient.get('/api/cart').then((r) => r.data),

  addItem: (variantId: number, quantity: number): Promise<Cart> =>
    apiClient.post('/api/cart/items', { variantId, quantity }).then((r) => r.data),

  updateItem: (variantId: number, quantity: number): Promise<Cart> =>
    apiClient.put(`/api/cart/items/${variantId}`, { quantity }).then((r) => r.data),

  removeItem: (variantId: number): Promise<void> =>
    apiClient.delete(`/api/cart/items/${variantId}`).then((r) => r.data),

  clear: (): Promise<void> =>
    apiClient.delete('/api/cart').then((r) => r.data),
};
```

Feature APIs are thin wrappers around `apiClient`. They:
- Define the endpoint and method
- Type the response
- Let the global error handler deal with failures

### Query Keys Factory

```ts
// services/query/queryKeys.ts
export const queryKeys = {
  drops: {
    all: () => ['drops'],
    active: () => ['drops', 'active'],
    bySlug: (slug: string) => ['drops', 'slug', slug],
  },
  products: {
    all: () => ['products'],
    byDrop: (dropId: string) => ['products', 'drop', dropId],
    bySlug: (slug: string) => ['products', 'slug', slug],
  },
  cart: {
    me: () => ['cart', 'me'],
  },
  orders: {
    all: () => ['orders'],
    my: (page: number) => ['orders', 'my', page],
    admin: (filters: OrderFilters) => ['orders', 'admin', filters],
  },
};
```

Centralizing query keys prevents typos and makes cache invalidation reliable.

---

## 6. Authentication Architecture

### Login Flow

```
1. User submits LoginForm
2. useLogin() mutation calls authApi.login()
3. Response: { access_token, refresh_token, user }
4. useAuthStore.setAuth(user, access_token)
5. QueryClient clears cache (fresh data for new user)
6. navigate('/shop') or navigate('/admin') based on role
```

### Registration Flow

```
1. User submits RegisterForm
2. authApi.register() creates account
3. Auto-login: call login() internally
4. Store auth state
5. React to /shop
```

### Persistent Auth

- `access_token` → `localStorage` (survives refresh)
- On app boot: check `localStorage` → validate with `authApi.me()` → restore Zustand state
- If validation fails: clear storage, redirect to login

### Logout

```
1. Clear Zustand store
2. Clear localStorage
3. Clear React Query cache
4. Navigate to /auth/login
```

### Role-Based Access

| Role | Can access |
|------|-----------|
| `customer` | `/shop`, `/cart`, `/checkout`, `/customer/*` |
| `admin` | Everything above + `/admin/*` |
| none (unauthenticated) | `/shop`, `/drops`, `/products`, `/auth/*`, `/waitlist` |

Roles are checked at two levels:
1. **Route level** — `ProtectedRoute` with `roles` prop redirects before rendering
2. **UI level** — nav links, buttons, and menus conditionally render based on `user.role`

---

## 7. Component Architecture

### Component Categories

| Category | Responsibility | Location |
|----------|---------------|----------|
| **UI Primitives** | Styling, accessibility, no business logic | `shared/components/ui/` |
| **Form Primitives** | Form wiring, validation display | `shared/components/forms/` |
| **Layout Components** | Site chrome (header, footer, sidebar) | `shared/components/layout/` + `layouts/` |
| **Feature Components** | Business logic + presentation for one feature | `features/*/components/` |
| **Page Components** | Compose features into full views | `pages/` |

### Example: ProductCard (Feature Component)

```tsx
// features/products/components/ProductCard.tsx
export function ProductCard({ product }: { product: Product }) {
  const { data: drop } = useActiveDrop();
  const isAvailable = product.drop_id === drop?.id;

  return (
    <Link to={`/products/${product.slug}`} className="group">
      <img src={product.images[0]} alt={product.name} className="aspect-square object-cover" />
      <h3 className="mt-2 font-medium">{product.name}</h3>
      <p className="text-sm text-gray-600">${product.base_price}</p>
      {!isAvailable && <Badge variant="outline">Sold Out</Badge>}
    </Link>
  );
}
```

No API calls inside the component. It consumes `useActiveDrop` from its own feature. It's reusable, testable, and has no external dependencies.

---

## 8. Layout Architecture

### Three Layouts

| Layout | Used On | Contains |
|--------|---------|---------|
| `PublicLayout` | `/`, `/shop`, `/drops`, `/products`, `/auth/*` | Logo, nav links, auth CTA, footer |
| `CustomerLayout` | `/cart`, `/checkout`, `/customer/*` | Logo, cart icon (with badge), user dropdown, footer |
| `AdminLayout` | `/admin/*` | Collapsible sidebar, breadcrumbs, user info |

### Layout Nesting

```
PublicLayout
├── Header
├── <Outlet />          ← page content
└── Footer

CustomerLayout
├── Header (cart + user)
├── <Outlet />
└── Footer

AdminLayout
├── AdminSidebar
├── AdminTopBar
└── <Outlet />
```

No duplicate header/footer code. Each layout is the single source of truth for its audience.

---

## 9. Data Fetching Strategy

### Caching

| Data | Stale Time | Strategy |
|------|-----------|----------|
| Active drop | 30s | `staleTime: 30_000` |
| Products | 30s | Cached by drop ID |
| Cart | 0s | Always fresh — refetch on window focus |
| Orders | 30s | Paginated, keep previous page |
| Notifications | 60s | Background refetch |

### Mutations with Optimistic Updates

```tsx
// features/cart/hooks/useAddToCart.ts
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: AddParams) =>
      cartApi.addItem(variantId, quantity),

    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.me });
      const previous = queryClient.getQueryData(queryKeys.cart.me);

      queryClient.setQueryData(queryKeys.cart.me, (old: Cart) => ({
        ...old,
        items: [...old.items, { ...newItem, id: 'temp-' + Date.now() }],
        total: old.total + newItem.quantity * 25,
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cart.me, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.me });
    },
  });
}
```

When the user adds to cart:
1. Immediately update the UI (optimistic)
2. Send API request
3. On error: roll back to previous state
4. On success: refetch from server to confirm

### Pagination

```tsx
export function useOrders(page: number, limit: number) {
  return useQuery({
    queryKey: queryKeys.orders.my(page),
    queryFn: () => ordersApi.getMy({ page, limit }),
    keepPreviousData: true,
  });
}
```

### Filtering

```tsx
export function useAdminOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders.admin(filters),
    queryFn: () => ordersApi.adminGetAll(filters),
    enabled: Object.keys(filters).length > 0,
  });
}
```

---

## 10. Error Handling Strategy

### Three-Tier Architecture

**Tier 1 — Axios interceptor**
Normalizes HTTP errors into plain `Error` instances. 401s go to token refresh.

**Tier 2 — Feature hooks**
Expose `error`, `isError`, `isPending` for the UI:

```tsx
const { addToCart, error, isAdding } = useAddToCart();
if (error) toast.error(error.message);
```

**Tier 3 — Global Error Boundary**
Catches unhandled React errors and renders `ServerErrorPage`.

### Standardized API Response

Every API endpoint returns:

```ts
// Success
{ success: true, ...data }

// Failure
{ success: false, error: "human readable", errorId: "A1B2C3D4" }
```

### Error Display by Context

| Error | Display |
|-------|---------|
| Validation (400) | Inline field errors + toast |
| Auth (401) | Redirect with toast |
| Forbidden (403) | Redirect to `/unauthorized` |
| Not found (404) | Empty state component |
| Server (500) | Error boundary + toast |
| Network | Toast + retry button |

---

## 11. Performance Architecture

### Route-Level Code Splitting

Every page is lazy-loaded. Admin pages are in a separate chunk:

```tsx
const AdminProducts = lazy(() => import('@/pages/admin/AdminProductsPage'));
```

Resulting chunks:
- `main.[hash].js` — app shell + public pages
- `admin.[hash].js` — admin pages only
- `auth.[hash].js` — auth pages only

### Image Strategy

- Product images: `<Image>` with `loading="lazy"`, blur placeholder, `srcset` for responsive sizes
- Drop hero: eager load (above the fold), low-quality placeholder
- WebP/AVIF via Vite build pipeline

### List Virtualization

For long lists (admin orders, notifications):

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: orders.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});
```

### Memoization Rules

- Memoize list items when parent re-renders frequently
- Memoize expensive computations with `useMemo`
- **Don't** memoize by default — profile before optimizing

---

## 12. Scalability & Maintainability

### Adding a New Feature

Always the same 5 steps:

```
1. Create features/new-feature/
2. Add api/, components/, hooks/, types/
3. Add feature index.ts
4. Create pages/newFeaturePage.tsx
5. Add route in router.tsx
```

No existing code touched. Zero merge conflicts.

### Adding a New API Endpoint

```
1. Add function to features/feature/api/featureApi.ts
2. Add React Query hook in features/feature/hooks/
3. Consume hook in component
```

No axios in components. No response parsing in components.

### Multi-Developer Workflow

| Concern | Isolation Mechanism |
|---------|-------------------|
| Feature A developer | Works in `features/a/` only |
| Feature B developer | Works in `features/b/` only |
| Shared component change | `shared/components/ui/` — reviewed carefully |
| API contract change | `services/api/` + feature `api/` files |

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Features | kebab-case, singular | `drops/`, not `drop-listings/` |
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase with `use` prefix | `useCart.ts` |
| API functions | camelCase | `getActiveDrop()` |
| Types | PascalCase | `Cart`, `CartItem` |
| Query keys | factory functions | `queryKeys.orders.my(page)` |
| Stores | camelCase + `Store` | `authStore.ts` |

### Path Aliases

```ts
// vite.config.ts + tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/constants/*": ["./src/constants/*"],
    }
  }
}
```

No more `../../../../features/cart/hooks/useCart`. Just `@/features/cart/hooks/useCart`.

---

## Trade-offs & Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Server state library | React Query | Best caching, mutations, devtools for apps with heavy API usage |
| Client state library | Zustand | Zero boilerplate, needs <10 stores for this app — Redux is overkill |
| Styling | Tailwind | Utility-first, no CSS file sprawl, consistent design system |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders |
| API client | Axios | Interceptors for auth, automatic JSON, global error handling |
| Feature organization | By domain | Scales with team size — parallel feature development, zero conflicts |
| Type safety | TypeScript strict | Prevents runtime errors, enables IDE refactoring |

---

## Final Verdict

This architecture is **production-ready and built to scale**. It supports:
- 10+ features with no refactoring
- 5+ developers working in parallel
- Adding new API endpoints without touching UI code
- Switching auth providers without rewriting components
- Adding admin modules without bloating customer bundles
- A maintainable codebase for years
