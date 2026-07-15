# Zaya — Claude Code Project Brain

> Read this file at the start of EVERY session before touching code.
> Backend/admin/integrations specs: `docs/backend/README.md`.
> Performance / SEO / skeletons: `docs/performance-seo-plan.md`.
> DRY / reuse cleanup: `docs/code-duplication-cleanup-plan.md`.
> Business tactics (sales/retention): `BUSINESS-PLAN.md`.

---

## What This Is

**Zaya** (زينة, "adornment") is a women's accessories e-commerce storefront for Egypt, targeting
Class A/B customers. Business model: dropshipping — products sourced from Temu/Shein-style suppliers,
sold with a 20–30% margin, delivered across Egypt (cash on delivery today; card/wallet via **Paymob**
and fulfilment via **Bosta** are built behind feature flags — see Roadmap +
`docs/backend/09-integrations-bosta-paymob.md`).

**Current state:** storefront + admin are feature-complete on **Cloudflare** (OpenNext Workers +
**D1** + **R2** + Drizzle). Client features call **services → `/api/*`** only. Cart / favorites /
recently-viewed remain client Zustand; auth, catalog, orders, account, bridal, reviews, promos, and
admin are server-backed. Live HTTP contract: **`API.md`**.

## Business Rules (single source: `src/config/site.config.ts`)

| Rule | Value | Where |
| --- | --- | --- |
| Profit margin | 25% (allowed 20–30%) | `PROFIT_MARGIN` |
| Shipping Cairo/Giza | 50 EGP | `SHIPPING_RATES.cairo_giza` |
| Shipping nearby governorates | 80 EGP | `SHIPPING_RATES.near` |
| Shipping far (Upper Egypt/Sinai) | 100 EGP | `SHIPPING_RATES.far` |
| Free shipping | orders ≥ 1,500 EGP | `FREE_SHIPPING_THRESHOLD` |
| Payment | COD default; **Paymob** (card + wallet) behind `online_payments` | checkout feature |
| Fulfilment | Manual default; **Bosta** behind `bosta_shipping` (P15 hardening done) | orders / shipments |
| Domain (placeholder) | `SITE.url` — update when real domain bought | |

**Pricing model:** products store `basePrice` (EGP cost) and optional `basePriceUsd` /
`landedCost` (server-only). Customer price = `computeSellPrice(product, settings)` —
flag `dynamic_pricing` OFF (default) → flat EGP cost × `(1+profit_margin)`, rounded up to 5 EGP;
ON + USD base → landed-cost engine (`docs/backend/11` §1.2: FX + shipping + customs + VAT +
handling → target margin). Never hardcode sell prices; cost inputs never go to the storefront.
Rates are settings-driven and **must be verified** against current regulations before go-live.

**Governorate → zone mapping:** D1 `governorates` (admin-editable). Shipping =
server `getShippingCost` (zone fees + free threshold from DB). Checkout/cart **preview** uses
`GET /api/storefront-config` (not static `SHIPPING_RATES` alone).

**Promo codes:** D1 `promos` via `POST /api/promos/validate` (admin CRUD). Applied in cart.

## Stack

- Next.js (App Router) **16** + React **19** + TypeScript `strict: true`
- Tailwind CSS **v4** (CSS-first — tokens in `src/styles/tokens.css`, mapped via `@theme inline`
  in `src/app/globals.css`; there is NO `tailwind.config.ts`)
- Zustand (client state, persisted) + React Query (server state)
- react-hook-form + Zod v4 on every form
- lucide-react icons · pnpm
- **Runtime:** Cloudflare Workers via `@opennextjs/cloudflare` + D1 (SQLite) + Drizzle ORM + R2
  (uploads). See `docs/backend/01-architecture.md`.

## Source layout

```
src/
  app/                 # App Router pages + loading.tsx + API routes
  config/              # site.config, features.config
  features/            # one folder per product feature (barrel = index.ts)
  server/              # DB, repos, services, jobs, auth, http, mappers, utils
  shared/              # UI, contracts, hooks, stores, rbac, lib, data (seed/legacy)
  styles/              # design tokens
  middleware.ts
```

| Layer | Path | Role |
| --- | --- | --- |
| Feature UI / hooks / client services | `src/features/[name]/` | Storefront & admin screens; import via barrel only |
| Shared Zod contracts | `src/shared/contracts/` | API DTOs + query schemas (`common.contract.ts` for pagination) |
| Shared UI | `src/shared/components/ui/` | Primitives + `skeleton/` compositions; re-export from `ui/index.ts` |
| Server services | `src/server/services/` | Business logic used by `app/api/*` |
| Repositories | `src/server/repositories/` | Drizzle / D1 access |
| Pagination helpers | `src/server/utils/pagination.ts` | `parsePaginationFromUrl`, `normalizePagination`, `buildPaginatedResult` |
| DTO mappers | `src/server/mappers/` | e.g. `order.mapper.ts` (storefront + admin order DTOs) |

**Seed / bootstrap:** `pnpm db:seed` (local) · `pnpm db:seed:remote` (production D1).
`src/shared/data/*` is seed/legacy; prefer D1 via services for live reads. Sitemap still uses
seed catalogs until wired to D1 (see `docs/performance-seo-plan.md`).

## Architecture Rules — NON-NEGOTIABLE

1. **One directory per feature** under `src/features/` — UI, hooks, store, schema, services live inside it.
2. **Barrel exports** — external code imports ONLY from `features/[name]/index.ts`, never deep paths.
3. **All data access via services** — e.g. `features/shop/services/products.service.ts` → `/api/*`.
   Components never import data files or server repos directly.
4. **No `any`**, no Redux, no tokens in localStorage (cart / favorites / recently-viewed metadata only;
   auth uses an httpOnly session cookie).
5. **Mobile-first** Tailwind; WCAG: icon buttons need `aria-label`, forms use real `<label>`s.
6. **Hydration**: any component reading persisted Zustand stores must gate on `useHydrated()`
   (`src/shared/hooks/useHydrated.ts`) — NOT `useEffect(() => setMounted(true))` (lint error).
7. **Animations are CSS-only** — utilities `animate-fade-up`, `animate-pop`, `stagger` in `globals.css`.
   No animation libraries. Respect `prefers-reduced-motion` (handled globally).
8. **Feature flags** — `src/config/features.config.ts` drives `middleware.ts` (disabled routes → 404)
   and `FeatureContext`. Respect flags (`wallet` OFF; `homepage_builder` gates `/admin/homepage`;
   `dynamic_pricing` / `online_payments` / `bosta_shipping` / `bundles` / `preorders` /
   `social_auth` / `social_proof` default OFF unless flipped).
9. **Secrets / cost fields** — never expose `basePrice`, `passwordHash`, or landed-cost internals in
   storefront DTOs (`pnpm assert:no-secrets`).
10. **Pagination / envelopes** — prefer `PaginationQuerySchema` + `paginatedSchema` /
    `createPaginatedResponseSchema` from `@/shared/contracts/common.contract` and
    `src/server/utils/pagination.ts`. Do not invent parallel page/pageSize shapes.
11. **Loading UX** — route `loading.tsx` files use shared skeleton compositions from
    `@/shared/components/ui` (not ad-hoc spinners). See `docs/performance-seo-plan.md`.

## Features Map

| Feature | Path | Notes |
| --- | --- | --- |
| Shop/catalog | `features/shop/` | grid, category pills, sort, services + React Query hooks |
| Product details | `features/product/` | gallery, add-to-bag, related, reviews API, recently-viewed, new arrivals |
| Product search | `features/product-search/` | modal search over name/category/tags (`useSearch`) |
| Cart | `features/cart/` | `cart.store.ts` (persist `Zaya-cart`): items, coupon, note; recommendations |
| Checkout | `features/checkout/` | Zod schema (Egyptian phone), shipping calc, COD (+ Paymob when flagged) |
| Orders | `features/order/` | confirmation + details via `/api/orders`; status timeline |
| Account | `features/account/` | profile/addresses/favorites/wallet via `/api/account/*`; wallet flag OFF; vouchers UI only |
| Auth | `features/auth/` | login/register/forgot, illustration + social buttons (gated), `AuthGuard`, `/api/auth/*` |
| Favorites/wishlist | `shared/store/favorites.store.ts` | guest wishlist; synced to `/api/account/favorites` on login |
| Bridal custom | `features/bridal-custom/` | landing + coming-soon + multipart → `/api/bridal-requests` + R2 |
| Homepage | `features/homepage/` | classic home + optional `homepage_blocks` (`homepage_builder` flag) |
| Admin | `features/admin/` | CRUD + dashboard/stats/audit + media/shipments/bundles/import |

**Persisted Zustand keys:** `Zaya-cart`, `Zaya-favorites`, `Zaya-recently-viewed`.
Auth / profile / addresses / orders / wallet / bridal / reviews are server-backed.

## Pages

**Storefront:** `/` · `/shop` · `/shop/[category]` · `/product/[id]` · `/cart` · `/checkout` ·
`/order/[id]` · `/bride` (admin toggles `bridal_page_enabled` + `bridal_show_*` /
`bridal_custom_enabled`; off → coming soon) · `/bride/custom`

**Auth (unified — no legacy `/login` or `/register`):** `/auth/login` · `/auth/register` ·
`/auth/forgot-password` · (flag routes may include reset-password). Header account affordance →
`/account`; `AuthGuard` sends guests to `/auth/login`.

**Account** (`AuthGuard`): `/account` · `/account/profile` · `/account/addresses` ·
`/account/favorites` · `/account/orders` · `/account/wallet` · `/account/vouchers`

**Admin** (`AdminGuard` + `requireAdmin`): `/admin` · `/admin/login` · `/admin/forbidden` ·
`/admin/products` · `/admin/products/new` · `/admin/products/[id]/edit` · `/admin/categories` ·
`/admin/categories/new` · `/admin/categories/[slug]/edit` · `/admin/orders` · `/admin/orders/[id]` ·
`/admin/users` · `/admin/users/[id]` · `/admin/locations` · `/admin/promos` · `/admin/bridal` ·
`/admin/bridal/[id]` · `/admin/activity` · `/admin/settings` · `/admin/homepage` · `/admin/media` ·
`/admin/shipments` · `/admin/bundles` · `/admin/import`

**Legal/marketing:** `/about` · `/contact` · `/privacy` · `/terms` · `/cookies`

**Categories:** jewelry, bags, hair, scarves, sunglasses, watches, **bride**.

### Route loading skeletons

Prefer shared compositions from `shared/components/ui/skeleton` (exported via `ui/index.ts`):

| Route | Typical skeleton |
| --- | --- |
| `/` | `HomePageSkeleton` |
| `/shop`, `/shop/[category]` | `ShopPageSkeleton` |
| `/product/[id]` | `ProductPageSkeleton` |
| `/cart` · `/checkout` · `/order/[id]` · `/account` · `/bride*` · `/auth/*` | matching `*Skeleton` |

## User/Data Logic (how the site actually works)

- **Catalog:** shop services → `/api/products*` (D1); RSC pages use server `product.service`. Sell
  `price` only (no `basePrice` in client).
- **Cart:** client-only Zustand; coupons via `POST /api/promos/validate`.
- **Checkout → order:** `usePlaceOrder` → `POST /api/orders` (server totals); confirmation via
  `GET /api/orders/[id]`.
- **Auth:** `authService` → `/api/auth/*`; session cookie is source of truth; `AuthGuard` waits on `/me`.
- **Bridal:** landing from settings/flags; `BridalRequestForm` → `POST /api/bridal-requests`
  (multipart; optional image/video ≤25MB → R2).
- **Reviews:** `ProductReviews` → `GET /api/reviews?productId=`. Create API exists (auth); no
  storefront submit UI yet.
- **Admin lists:** parse `page` / `pageSize` via `parsePaginationFromUrl` / contract schemas; return
  `buildPaginatedResult` / `Paginated<T>` envelopes.

## SEO (keep intact; improve per plan)

- `layout.tsx`: metadataBase, title template, OG/Twitter, robots, Organization+WebSite JSON-LD
- `product/[id]/page.tsx`: `generateMetadata` + Product JSON-LD (price, availability, rating)
- `shop/[category]`: per-category meta + `generateStaticParams`
- `app/sitemap.ts` + `app/robots.ts` (cart/checkout/order disallowed & noindexed)
- Keywords include Arabic terms (اكسسوارات حريمي, اكسسوارات فرح)
- When adding a page: add metadata + canonical + sitemap entry. When adding a category: fill
  `seoDescription`.
- **Open gaps:** sitemap still seeded from `shared/data`; deeper RSC for shop/product HTML; ISR /
  image remotePatterns — track in `docs/performance-seo-plan.md`.

## DRY / reuse (when touching overlapping code)

Follow `docs/code-duplication-cleanup-plan.md`. Prefer:

1. Shared contracts in `common.contract.ts` (no wire-shape changes)
2. `src/server/utils/pagination.ts` + existing list services/repos
3. `src/server/mappers/order.mapper.ts` for order DTO mapping
4. Feature-local admin list shells / order summary UI only when clones are real
5. Do **not** resurrect legacy `/login` or `/register` App Router pages

## Verification (run after every change group)

```bash
pnpm build              # 0 errors
pnpm typecheck          # 0 errors
pnpm lint               # 0 errors (1 known benign warning: react-hooks/incompatible-library on RHF watch())
pnpm assert:no-secrets  # no basePrice / passwordHash in API or client DTOs

# Optional DRY check (ignore JSON seed noise):
npx jscpd src --min-tokens 40 --ignore "**/*.json,**/*.sql,**/*.css"
```

## Conventions

Components PascalCase · hooks `useX` · dirs kebab-case · `*.types.ts` / `*.store.ts` / `*.service.ts` /
`*.schema.ts` / `*.data.ts` / `*.config.ts` · conventional commits (`feat:`, `fix:`…).

## Docs index

| Doc | Purpose |
| --- | --- |
| `docs/backend/README.md` | Phased backend / admin / integrations specs |
| `docs/backend/01`–`11` | Architecture, data model, API, plan, admin, Bosta/Paymob, enhancements, sourcing |
| `docs/performance-seo-plan.md` | CWV, skeletons, sitemap/ISR, SEO backlog |
| `docs/code-duplication-cleanup-plan.md` | jscpd baseline + phased DRY work |
| `API.md` | Live storefront + admin HTTP contract |
| `BUSINESS-PLAN.md` | Sales / CRO / retention tactics mapped to features |

## Known Placeholders / TODO

- Product images are often gradient SVGs in `public/images/` — replace with real photos (admin → R2).
- `SITE.url` is still a placeholder domain (`https://Zaya-eg.com`) — update when purchased.
- Wallet flag OFF → page + API 404 (seeded wallet txns ready when flag flips).
- Review **create** API exists (auth); no storefront submit UI yet.
- Seed passwords (`password123`) are for bootstrap only — rotate before public go-live.
- **API.md** documents the live contract. Admin Phase 8–12 + P16–P26 done; **P13 Paymob** +
  **P14 Bosta** + **P15 hardening** done — see `09`. Flags `online_payments` / `bosta_shipping`
  default OFF.
- **Roadmap:** production secret cutover + deploy smoke, Arabic RTL, D1-backed sitemap, tighten
  RSC for catalog pages.
- **Catalog visibility:** lists/search = `published` only; product detail allows `published`|`hidden`;
  checkout requires `published` + available stock (reserves on place; cancel releases; delivered sells).
  Admin create defaults to `draft`; DELETE archives.
