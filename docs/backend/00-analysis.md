# 00 — Codebase Analysis

> Source of truth for what the backend must support. **Every** backend feature in these docs
> maps to something that already exists in the frontend. Nothing here is invented.
> Re-verify against the code before implementing (see `08-checklist.md`).

Analyzed: Next.js **16.2.10** (App Router) · React **19.2** · TypeScript strict · Tailwind v4 ·
Zustand (persisted) · React Query · react-hook-form + Zod v4. Package manager: **pnpm**.

---

## 1. Pages (App Router)

| Route | File | Data it needs | Auth |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | featured products, categories, new arrivals | public |
| `/shop` | `app/shop/page.tsx` | all products, categories, sort | public |
| `/shop/[category]` | `app/shop/[category]/page.tsx` | products by category (+SSG params, SEO) | public |
| `/product/[id]` | `app/product/[id]/page.tsx` | product by id, related, reviews (+SSG/meta) | public |
| `/cart` | `app/cart/page.tsx` | cart (client), recommendations, promo validation | public |
| `/checkout` | `app/checkout/page.tsx` | governorates, shipping calc, place order | public |
| `/order/[id]` | `app/order/[id]/page.tsx` | order by id | public |
| `/bride/custom` | `app/bride/custom/page.tsx` | submit bridal request (+file) | public |
| `/auth/login` `/register` `/forgot-password` | `app/auth/*` | auth | public |
| `/account` + `/orders /profile /addresses /favorites /wallet /vouchers` | `app/account/*` | user data | **protected** (`AuthGuard`) |
| `/about /contact /privacy /terms /cookies` | static legal/marketing | none | public |

Categories (slugs): `jewelry, bags, hair, scarves, sunglasses, watches, bride`.

Routes disallowed/noindexed in SEO: `/cart`, `/checkout`, `/order`. Keep this after the migration.

---

## 2. Static data sources (the things being replaced)

All under `src/shared/data/`. This is the "dummy layer" the CLAUDE.md brain calls out.

| File | Shape | Rows | Becomes |
| --- | --- | --- | --- |
| `products.data.ts` | `Product[]` | 12 | `products` table |
| `categories.data.ts` | `Category[]` | 7 | `categories` table |
| `governorates.data.ts` | `Governorate[]` (`id,name,zone`) | 27 | `governorates` table (reference/read-only) |
| `promos.data.ts` | `PromoCode[]` + `validatePromoCode()` | 2 | `promos` table + server validation |
| `users.data.ts` | `User[]` (**plaintext password**) | 1 seed | `users` table (hashed) |

Additionally hardcoded **inside components** (not in the data layer):

- **Reviews** — `features/product/components/ProductReviews.tsx` holds a static array of 3 reviews and
  a fixed "4.8 / 124 reviews" summary. The `Product` type already carries `rating` + `reviewCount`.
  → becomes a `reviews` table (full scope per decision).
- **Wallet** — `features/account/store/wallet.store.ts` seeds a balance (350) + 2 transactions.
  Feature flag `wallet` is currently **OFF** in `features.config.ts`. → `wallet_transactions` table
  + computed balance (full scope; ships behind the existing flag).

---

## 3. Client state (Zustand, persisted to localStorage)

These `persist` stores are the second source the backend replaces or syncs. Persist keys are the
`Zaya-*` localStorage names.

| Store | Key | Persisted data | Backend treatment |
| --- | --- | --- | --- |
| `cart.store.ts` | `Zaya-cart` | items, couponCode, note | **stays client-side**; coupon validated server-side, prices verified at checkout |
| `orders.store.ts` | `Zaya-orders` | orders[] (+1 mock) | `orders` API (POST create, GET by id, GET list) |
| `bridal-requests.store.ts` | `Zaya-bridal-requests` | requests[] (file metadata only) | `bridal_requests` API + **R2** upload |
| `auth.store.ts` | `Zaya-auth` | user, isAuthenticated | session cookie; store holds public user only |
| `users.store.ts` | `Zaya-users` | mock user registry | `users` table (server) |
| `account/addresses.store.ts` | `Zaya-addresses` | SavedAddress[] | `addresses` API (list/create/delete) |
| `account/profile.store.ts` | `Zaya-profile` | {fullName,phone,email} | `profile` API (get/update) — derived from user |
| `account/wallet.store.ts` | `Zaya-wallet` | balance + transactions | `wallet` API (read) |
| `shared/store/favorites.store.ts` | `Zaya-favorites` | product id[] | `favorites` API (sync when authed) |
| `product/recently-viewed.store.ts` | `Zaya-recently-viewed` | last 10 products | **stays client-side** (UX); optional sync API |

> Rule from CLAUDE.md: only cart/order/request metadata is persisted client-side, and **no auth tokens
> in localStorage**. This is why we use an **httpOnly session cookie**, not a JWT in localStorage.

---

## 4. Service seams (already built for this migration)

The frontend already routes all data access through services with the explicit contract *"when the
real backend exists, replace ONLY these function bodies."* These are the integration points:

- `features/shop/services/products.service.ts` — `getProducts`, `getProductsByCategory`,
  `getFeaturedProducts`, `getProductById`, `getCategories`, `getRelatedProducts`, `getNewArrivals`,
  `searchProducts`. Each currently reads `src/shared/data` with a simulated latency.
- `features/auth/services/auth.service.ts` — `login`, `register`, `resetPassword`.

React Query hooks that call the product service: `features/shop/hooks/useProducts.ts`
(`useProducts, useFeaturedProducts, useProduct, useCategories, useRelatedProducts, useNewArrivals`)
and `features/product-search/hooks/useSearch.ts`, `features/cart/hooks/useCartRecommendations.ts`.

**Implication:** most of the migration is (a) build APIs, (b) rewrite service bodies to `fetch`, (c)
add mutation hooks where writes were direct store calls. The UI/components should not change.

---

## 5. Forms & write flows (need POST/PUT/DELETE)

| Flow | Component | Schema | Current write |
| --- | --- | --- | --- |
| Login | `auth/components/LoginForm.tsx` | `loginSchema` | `authService.login` → `authStore.login` |
| Register | `RegisterForm.tsx` | `registerSchema` | `authService.register` |
| Forgot password | `ForgotPasswordForm.tsx` | `forgotPasswordSchema` | `authService.resetPassword` |
| Checkout / place order | `checkout/components/CheckoutForm.tsx` | `checkoutSchema` (Egyptian phone regex) | `ordersStore.placeOrder` then `router.push('/order/'+id)` |
| Apply coupon | `cart.store.applyCoupon` | — | `validatePromoCode(code, subtotal)` |
| Bridal request | `bridal-custom/components/BridalRequestForm.tsx` | `bridalRequestSchema` (file ≤25MB, image/video) | `bridalRequestsStore.submitRequest` (metadata only) |
| Add/remove address | `account/components/AddressBook.tsx` | (inline) | `addressesStore` |
| Update profile | `account/components/ProfileForm.tsx` | (inline) | `profileStore` |
| Toggle favorite | `WishlistButton` / `FavoritesGrid` | — | `favoritesStore.toggle` |
| Contact | `app/contact/page.tsx` | — | **none** — `mailto:` + WhatsApp only. No API needed. |

Newsletter/contact are static (mailto + WhatsApp), so **no** contact API is introduced.

---

## 6. Read/filter/sort/search/pagination already in the frontend

- **Filter by category**: `getProductsByCategory(slug)` / `/shop/[category]`.
- **Sort**: `features/shop/utils/sortProducts.ts` + `ProductSort.tsx` (client-side sort of fetched list).
- **Search**: `searchProducts(query)` — matches name/category/tags, capped at 8. Backed by `SearchModal`.
- **Featured / New arrivals / Related**: dedicated service functions.
- **Pagination**: **not present** in the frontend today → not invented. (Catalog is small; add later.)
- **Recommendations**: `useCartRecommendations` derives from products (see hook).

---

## 7. Business logic that must live server-side (not just client)

These currently run on the client and must be **authoritative** on the server so prices/totals can't be
tampered with:

- **Selling price** = `getSellPrice(basePrice)` = `ceil(basePrice * 1.25 / 5) * 5`
  (`shared/utils/price.ts`, `PROFIT_MARGIN` in `site.config.ts`). Clients never see `basePrice`.
- **Shipping** = `getShippingCost(governorateId, subtotal)` — zone rate (Cairo/Giza 50, near 80, far 100),
  free ≥ 1500 EGP (`checkout/utils/shipping.ts` + `SHIPPING_RATES`, `FREE_SHIPPING_THRESHOLD`).
- **Promo validation** = `validatePromoCode(code, subtotal)` (percentage/fixed, optional `minOrderValue`).
- **Order totals** = subtotal (Σ unitPrice×qty) − discount + shipping.

> **Security note:** `basePrice` is the sourcing cost and must **never** be sent to the browser. The
> product read APIs return `price` (computed sell price) and optional `compareAtPrice` only.

---

## 8. Feature flags (keep working)

`config/features.config.ts` drives `middleware.ts` (disabled routes → 404) and `FeatureContext`.
`wallet` is OFF; `auth, promo_code, order_note` are ON. The backend must respect these flags — e.g.
don't hard-require auth on public reads, and keep wallet endpoints gated behind the flag.

---

## 9. Scope notes

**In scope but no storefront UI exists yet — built as a new admin surface** (`08-admin-dashboard.md`):
product/category/order/user/location/promo/settings management. The admin dashboard manages **only the
entities that already exist** in this project (products, categories, governorates+shipping zones, orders,
users, promos, bridal requests, config). It adds an `admin` role on `users`, admin APIs under
`/api/admin`, and pages under `/admin` — the storefront UI/UX stays unchanged.

**In scope — real integrations** (`09-integrations-bosta-paymob.md`): **Paymob** payments (card + mobile
wallet, alongside COD) and **Bosta** fulfilment (delivery creation, COD collection, live tracking). The
current `cod` literal is the baseline; these extend checkout without changing its look. The CLAUDE.md
roadmap already names Paymob and Bosta.

**In scope — sourcing, dynamic pricing & merchandising** (`11-sourcing-pricing-merchandising.md`): a
**Temu importer**, a **landed-cost pricing engine** (this **changes** the current flat `basePrice × 1.25`
model — behind the `dynamic_pricing` flag), real-time stock sync, a micro-warehousing fulfilment model,
and merchandising (bundles, pre-orders, shipping timelines, social proof). These are deliberate
business-logic changes / net-new capabilities — **not** derived from today's storefront — so they ship
flag-gated with a migration step. Tax/customs rates and Temu's ToS must be independently verified.

**Explicitly NOT being built (no data/feature for it):**

- Product **variants** — the `Product` type has none; no variant UI or table.
- Fawry / other gateways beyond Paymob; other couriers beyond Bosta.
- Review submission form (endpoint provided, no UI), storefront product pagination.
- Contact form submission API (page uses mailto/WhatsApp).

These are noted so an implementer does not invent endpoints/tables for them.
