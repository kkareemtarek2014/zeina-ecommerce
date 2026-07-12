# Zaya — Claude Code Project Brain

> Read this file at the start of EVERY session before touching code.
> For the backend/admin/integrations migration, also read `docs/backend/README.md` (specs index).

---

## What This Is

**Zaya** (زينة, "adornment") is a women's accessories e-commerce storefront for Egypt, targeting
Class A/B customers. Business model: dropshipping — products sourced from Temu/Shein-style suppliers,
sold with a 20–30% margin, delivered across Egypt (cash on delivery today; card/wallet via Paymob and
fulfilment via Bosta are planned — see Roadmap + `docs/backend/09-integrations-bosta-paymob.md`).

**Current state:** frontend is feature-complete and runs on a **dummy data layer** (static files +
persisted Zustand stores). No real backend yet. The full plan to move onto Cloudflare (Workers + D1 +
R2), add an admin dashboard, and integrate Bosta + Paymob lives in **`docs/backend/`**.

## Business Rules (single source: `src/config/site.config.ts`)

| Rule | Value | Where |
| --- | --- | --- |
| Profit margin | 25% (allowed 20–30%) | `PROFIT_MARGIN` |
| Shipping Cairo/Giza | 50 EGP | `SHIPPING_RATES.cairo_giza` |
| Shipping nearby governorates | 80 EGP | `SHIPPING_RATES.near` |
| Shipping far (Upper Egypt/Sinai) | 100 EGP | `SHIPPING_RATES.far` |
| Free shipping | orders ≥ 1,500 EGP | `FREE_SHIPPING_THRESHOLD` |
| Payment | Cash on delivery today; **Paymob** (card + mobile wallet) planned | checkout feature |
| Fulfilment | Manual today; **Bosta** delivery (COD collection + tracking) planned | orders feature |
| Domain (placeholder) | `SITE.url` — update when real domain bought | |

**Pricing model (current):** products store `basePrice` (sourcing cost in EGP). Customer price =
`getSellPrice()` in `src/shared/utils/price.ts` — cost + margin, rounded UP to nearest 5 EGP. Never
hardcode selling prices. `basePrice` is a secret sourcing cost and must **never** be sent to the browser
once the backend exists (only admin sees it).

**Pricing model (target — `docs/backend/11`):** a server-side **landed-cost engine** replaces the flat
margin when the `dynamic_pricing` flag is ON — Temu USD base × live USD/EGP rate + ~$2 bulk shipping +
10.5% customs (Gamarek) + 14% VAT + ~100 EGP handling → **50% margin on landed cost**, rounded to 5 EGP.
`getSellPrice` becomes `computeSellPrice(product, settings)` (single price authority). All rates are
settings-driven and **must be verified** against current regulations; all cost inputs stay server-only.

**Governorate → zone mapping:** `src/shared/data/governorates.data.ts` (all 27 governorates → zone).
Shipping cost = `getShippingCost(governorateId, subtotal)` in `features/checkout/utils/shipping.ts`.

**Promo codes:** `src/shared/data/promos.data.ts` + `validatePromoCode(code, subtotal)` (percentage or
fixed, optional `minOrderValue`). Applied in `cart.store.applyCoupon`.

## Stack

- Next.js (App Router) **16** + React **19** + TypeScript `strict: true`
- Tailwind CSS **v4** (CSS-first config — tokens in `src/styles/tokens.css`, mapped via `@theme inline`
  in `src/app/globals.css`; there is NO tailwind.config.ts)
- Zustand (client state, persisted) + React Query (server state)
- react-hook-form + Zod v4 on every form
- lucide-react icons · pnpm
- **Planned backend:** Cloudflare Workers (via `@opennextjs/cloudflare`) + D1 (SQLite) + Drizzle ORM +
  R2 (uploads). See `docs/backend/01-architecture.md`.

## Architecture Rules — NON-NEGOTIABLE

1. **One directory per feature** under `src/features/` — UI, hooks, store, schema, services live inside it.
2. **Barrel exports** — external code imports ONLY from `features/[name]/index.ts`, never deep paths.
3. **All data access via services** — e.g. `features/shop/services/products.service.ts`. Components never
   import data files directly (data files in `shared/data/` are the dummy layer).
4. **Dummy data layer** — Temu has no public API. Everything reads from `src/shared/data/` (or persisted
   stores). When the real backend exists, document it in `API.md` and change ONLY service bodies / store
   submit functions (the seams were built for this — see `docs/backend/04-frontend-integration.md`).
5. **No `any`**, no Redux, no tokens in localStorage (only cart/order/request metadata is persisted
   client-side; auth uses an httpOnly session cookie once the backend lands).
6. **Mobile-first** Tailwind; WCAG: icon buttons need `aria-label`, forms use real `<label>`s.
7. **Hydration**: any component reading persisted Zustand stores must gate on `useHydrated()`
   (`src/shared/hooks/useHydrated.ts`) — NOT `useEffect(() => setMounted(true))` (lint error).
8. **Animations are CSS-only** — utilities `animate-fade-up`, `animate-pop`, `stagger` in `globals.css`.
   No animation libraries. Respect `prefers-reduced-motion` (already handled globally).
9. **Feature flags** — `src/config/features.config.ts` drives `middleware.ts` (disabled routes → 404) and
   `FeatureContext`. Respect flags (e.g. `wallet` is currently OFF).

## Features Map

| Feature | Path | Notes |
| --- | --- | --- |
| Shop/catalog | `features/shop/` | grid, category pills, sort, services + React Query hooks |
| Product details | `features/product/` | gallery, add-to-bag, related, reviews (hardcoded), recently-viewed, new arrivals |
| Product search | `features/product-search/` | modal search over name/category/tags (`useSearch`) |
| Cart | `features/cart/` | `cart.store.ts` (persist `Zaya-cart`): items, coupon, note; recommendations |
| Checkout | `features/checkout/` | Zod schema (Egyptian phone), shipping calc, COD; places order |
| Orders | `features/order/` | client order log (`Zaya-orders`), confirmation, status timeline |
| Account | `features/account/` | profile, addresses, favorites, wallet (flag OFF), orders, vouchers |
| Auth | `features/auth/` | login/register/forgot, `AuthGuard`, mock users store (plaintext seed) |
| Favorites/wishlist | `shared/store/favorites.store.ts` | shared across shop cards, product, account |
| Bridal custom | `features/bridal-custom/` | photo/video request form; replies ≤ 2 days; file NOT uploaded yet (needs backend) |

**Persisted Zustand keys:** `Zaya-cart`, `Zaya-orders`, `Zaya-bridal-requests`, `Zaya-auth`,
`Zaya-users`, `Zaya-addresses`, `Zaya-profile`, `Zaya-wallet`, `Zaya-favorites`, `Zaya-recently-viewed`.

## Pages

Storefront: `/` · `/shop` · `/shop/[category]` · `/product/[id]` · `/cart` · `/checkout` ·
`/order/[id]` · `/bride/custom`
Auth: `/auth/login` · `/auth/register` · `/auth/forgot-password`
Account (protected by `AuthGuard`): `/account` · `/account/profile` · `/account/addresses` ·
`/account/favorites` · `/account/orders` · `/account/wallet` · `/account/vouchers`
Legal/marketing: `/about` · `/contact` · `/privacy` · `/terms` · `/cookies`
Planned (backend): `/admin/**` (dashboard — `docs/backend/08-admin-dashboard.md`).

Categories: jewelry, bags, hair, scarves, sunglasses, watches, **bride**.

## User/Data Logic (how the site actually works)

- **Catalog:** `products.service` reads `shared/data/products.data.ts`; hooks in
  `features/shop/hooks/useProducts.ts` wrap it in React Query. Prices derived from `basePrice` via
  `getSellPrice`. Search/related/featured/new-arrivals are service functions.
- **Cart:** client-only. `addItem` stores the computed sell price as `unitPrice`. Coupons validated by
  `validatePromoCode`. Selectors compute count/subtotal/discount/total.
- **Checkout → order:** `CheckoutForm` validates (Egyptian phone, governorate), computes shipping, then
  `ordersStore.placeOrder(draft)` creates a `ZN-…` order client-side and routes to `/order/[id]`.
  Payment is `cod` literal today.
- **Auth (mock):** `authService` reads/writes `useUsersStore` (seeded, plaintext). `authStore` holds the
  session; `AuthGuard` gates `/account/*` after hydration.
- **Bridal:** `BridalRequestForm` validates a photo/video (≤25MB) and stores metadata only (no upload).

## SEO (already implemented — keep it intact)

- `layout.tsx`: metadataBase, title template, OG/Twitter, robots, Organization+WebSite JSON-LD
- `product/[id]/page.tsx`: `generateMetadata` + Product JSON-LD (price, availability, rating)
- `shop/[category]`: per-category meta from `seoDescription` in categories data + `generateStaticParams`
- `app/sitemap.ts` + `app/robots.ts` (cart/checkout/order disallowed & noindexed)
- Keywords include Arabic terms (اكسسوارات حريمي, اكسسوارات فرح)
- When adding a page: add metadata + canonical + sitemap entry. When adding a category: fill `seoDescription`.

## Verification (run after every change group)

```bash
pnpm build      # 0 errors
pnpm typecheck  # 0 errors
pnpm lint       # 0 errors (1 known benign warning: react-hooks/incompatible-library on RHF watch())
```

## Conventions

Components PascalCase · hooks `useX` · dirs kebab-case · `*.types.ts` / `*.store.ts` / `*.service.ts` /
`*.schema.ts` / `*.data.ts` / `*.config.ts` · conventional commits (`feat:`, `fix:`…).

## Backend / Admin / Integrations plan

Full, phased specs live in **`docs/backend/`** — read the index first (`README.md`):
`00-analysis` · `01-architecture` · `02-data-model` · `03-api-contracts` · `04-frontend-integration` ·
`05-plan` · `06-tasks` · `07-checklist` · `08-admin-dashboard` · `09-integrations-bosta-paymob` ·
`10-enhancements` (inventory, timeline, analytics, RBAC, cron) ·
`11-sourcing-pricing-merchandising` (Temu import, landed-cost pricing, bundles, pre-orders).

## Known Placeholders / TODO

- Product images are gradient SVGs in `public/images/` — replace with real photos (keep same paths or
  update data files; admin image upload → R2 is specified in `docs/backend/08`).
- `SITE.url` is a placeholder domain.
- Reviews are hardcoded in `ProductReviews.tsx`; wallet is seeded + flag OFF (both become tables — see `02`).
- Bridal request uploads store file metadata only — real upload needs backend (multipart POST → R2).
- Auth is a plaintext mock — becomes hashed users + httpOnly session (see `03`).
- `API.md` doesn't exist yet — create it when defining the backend contract (`07` Phase 7).
- **Roadmap:** Cloudflare backend, admin dashboard, **Paymob** (card + mobile wallet), **Bosta**
  (shipping/fulfilment + COD collection + tracking), production enhancements (`docs/backend/10`:
  inventory, order timeline, analytics, RBAC, cron), **Temu sourcing + landed-cost dynamic pricing +
  bundles/pre-orders + micro-warehousing fulfilment** (`docs/backend/11`), Arabic RTL.
- **Sourcing/fulfilment model:** Temu is used to **sync catalog + track inventory** only. Automation
  never auto-orders at checkout — items are bulk-bought, repackaged in Zaya boxes, and shipped locally
  via Bosta (Temu prohibits direct dropshipping — verify their ToS). See `docs/backend/11` §4.
