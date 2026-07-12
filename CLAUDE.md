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
server `computeSellPrice(db, basePrice)` — effective `profit_margin` from `settings` (fallback
`PROFIT_MARGIN`), rounded UP to nearest 5 EGP via `getSellPrice(base, margin)`. Never hardcode selling
prices. `basePrice` is a secret sourcing cost and must **never** be sent to the browser (only admin
sees it).

**Pricing model (target — `docs/backend/11`):** a server-side **landed-cost engine** replaces the flat
margin when the `dynamic_pricing` flag is ON — Temu USD base × live USD/EGP rate + ~$2 bulk shipping +
10.5% customs (Gamarek) + 14% VAT + ~100 EGP handling → **50% margin on landed cost**, rounded to 5 EGP.
`computeSellPrice` remains the single price authority. All rates are settings-driven and **must be
verified** against current regulations; all cost inputs stay server-only.

**Governorate → zone mapping:** D1 `governorates` (admin-editable in P11). Shipping =
server `getShippingCost` (zone fees + free threshold from DB). Checkout/cart **preview** uses
`GET /api/storefront-config` (not static `SHIPPING_RATES`).

**Promo codes:** D1 `promos` via `POST /api/promos/validate` (admin CRUD in P11). Applied in cart.

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
4. **Dummy / seed data** — Temu has no public API. Local bootstrap uses `pnpm db:seed` (and
   `db:seed:remote` for production D1). Client features call **services → `/api/*`** only. Live
   contract: **`API.md`**. Further backend changes should prefer service bodies over UI rewrites
   (see `docs/backend/04-frontend-integration.md`).
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
| Account | `features/account/` | profile/addresses/favorites/wallet via `/api/account/*`; wallet flag OFF; vouchers UI only |
| Auth | `features/auth/` | login/register/forgot, `AuthGuard`, httpOnly session via `/api/auth/*` |
| Favorites/wishlist | `shared/store/favorites.store.ts` | shared across shop cards, product, account |
| Bridal custom | `features/bridal-custom/` | multipart → `/api/bridal-requests` + R2; replies ≤ 2 days |
| Admin | `features/admin/` | full CRUD modules (P8–P11) + **dashboard stats / audit writes (P12)** |

**Persisted Zustand keys:** `Zaya-cart`, `Zaya-favorites` (guest wishlist; synced to
`/api/account/favorites` on login), `Zaya-recently-viewed`. Auth/profile/addresses/orders/wallet/
bridal/reviews are server-backed.

## Pages

Storefront: `/` · `/shop` · `/shop/[category]` · `/product/[id]` · `/cart` · `/checkout` ·
`/order/[id]` · `/bride/custom`
Auth: `/auth/login` · `/auth/register` · `/auth/forgot-password`
Account (protected by `AuthGuard`): `/account` · `/account/profile` · `/account/addresses` ·
`/account/favorites` · `/account/orders` · `/account/wallet` · `/account/vouchers`
Admin (`AdminGuard` + `requireAdmin`): `/admin` · `/admin/login` · `/admin/forbidden` ·
`/admin/products` · `/admin/products/new` · `/admin/products/[id]/edit` · `/admin/categories` ·
`/admin/categories/new` · `/admin/categories/[slug]/edit` · `/admin/orders` · `/admin/orders/[id]` ·
`/admin/users` · `/admin/users/[id]` · `/admin/locations` · `/admin/promos` · `/admin/bridal` ·
`/admin/bridal/[id]` · `/admin/settings` — `/admin` dashboard stats live (P12).
Legal/marketing: `/about` · `/contact` · `/privacy` · `/terms` · `/cookies`

Categories: jewelry, bags, hair, scarves, sunglasses, watches, **bride**.

## User/Data Logic (how the site actually works)

- **Catalog:** shop services → `/api/products*` (D1); RSC pages use server `product.service`. Sell `price` only (no `basePrice` in client).
- **Cart:** client-only Zustand; coupons via `POST /api/promos/validate`.
- **Checkout → order:** `usePlaceOrder` → `POST /api/orders` (server totals); confirmation via `GET /api/orders/[id]`.
- **Auth:** `authService` → `/api/auth/*`; session cookie is source of truth; `AuthGuard` waits on `/me`.
- **Bridal:** `BridalRequestForm` → `POST /api/bridal-requests` (multipart; optional image/video ≤25MB → R2).
- **Reviews:** `ProductReviews` → `GET /api/reviews?productId=`.

## SEO (already implemented — keep it intact)

- `layout.tsx`: metadataBase, title template, OG/Twitter, robots, Organization+WebSite JSON-LD
- `product/[id]/page.tsx`: `generateMetadata` + Product JSON-LD (price, availability, rating)
- `shop/[category]`: per-category meta from `seoDescription` in categories data + `generateStaticParams`
- `app/sitemap.ts` + `app/robots.ts` (cart/checkout/order disallowed & noindexed)
- Keywords include Arabic terms (اكسسوارات حريمي, اكسسوارات فرح)
- When adding a page: add metadata + canonical + sitemap entry. When adding a category: fill `seoDescription`.

## Verification (run after every change group)

```bash
pnpm build              # 0 errors
pnpm typecheck          # 0 errors
pnpm lint               # 0 errors (1 known benign warning: react-hooks/incompatible-library on RHF watch())
pnpm assert:no-secrets  # no basePrice / passwordHash in API or client DTOs
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

- Product images are gradient SVGs in `public/images/` — replace with real photos (admin → R2 in `docs/backend/08`).
- `SITE.url` is still a placeholder domain (`https://Zaya-eg.com`) — update when purchased.
- Wallet flag OFF → page + API 404 (seeded wallet txns ready for when flag flips).
- Review **create** API exists (auth); no storefront submit UI yet.
- Seed passwords (`password123`) are for local/remote bootstrap only — rotate before public go-live.
- **API.md** documents the live storefront + admin contract. Admin Phase 8–12 + P16–**P17 inventory**
  done; remaining P18–23 in `06-tasks` / `10`.
- **Roadmap:** P18–23 enhancements (`10`), **Paymob** + **Bosta** (`09`), Temu + landed-cost (`11`), Arabic RTL.
- **Catalog visibility:** lists/search = `published` only; product detail allows `published`|`hidden`;
  checkout requires `published` + available stock (reserves on place; cancel releases; delivered sells).
  Admin create defaults to `draft`; DELETE archives.
