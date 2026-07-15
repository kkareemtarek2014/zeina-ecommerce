# Code Duplication Cleanup Plan

> Re-scanned **2026-07-15** with `jscpd` (`min-tokens: 40`) plus structural review.
> This document is the source of truth before any refactor implementation.

---

## Baseline (TS / TSX only)

| Metric | Value |
| --- | --- |
| Files analyzed | 414 (`*.ts` + `*.tsx`) |
| Clones found | **138** |
| Duplicated lines | **1,200 (3.51%)** |
| Duplicated tokens | **7,918 (4.09%)** |

> Ignore JSON clones in `src/` seed/fixture payloads (~40% of total when left unfiltered). Those are data, not code DRY violations.

### Clones by area (tokens)

| Area | Clones | Lines | Tokens | Priority |
| --- | --- | --- | --- | --- |
| Server services | 37 | 330 | 2,240 | High |
| Admin pages | 30 | 377 | 1,705 | High |
| Features | 21 | 212 | 1,192 | Medium |
| API routes | 21 | 163 | 1,090 | Medium |
| Server repos | 10 | 85 | 633 | High |
| Contracts | 9 | 68 | 508 | High |
| Server other / jobs | 6 | 49 | 341 | Low–Medium |
| Shared UI | 2 | 33 | 88 | Low |
| App storefront pages | 2 | 21 | 121 | Low |

---

## User review — plan status vs current tree

### Auth routing consolidation

| Proposed change | Current status |
| --- | --- |
| Delete `src/app/login/page.tsx` | **Already gone** — path does not exist |
| Delete `src/app/register/page.tsx` | **Already gone** — path does not exist |
| Auth under `src/app/auth/*` + `@/features/auth` | **Done** — `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| Header → `/account` or `/auth/login` | **Done** — Header links to `/account` (AuthGuard redirects unauth users) |

**No further auth-route deletes required.** Keep `/admin/login` (separate admin surface).

### Zero breaking API changes

Still valid: extract shared Zod pagination/envelope schemas without changing wire shapes.

---

## Proposed changes (updated)

### Phase 1 — Shared contracts (high value, low risk)

#### [NEW] `src/shared/contracts/common.contract.ts`

Extract reusable pieces currently scattered / redefined:

```ts
// Pagination query (query-string / URL params)
PaginationQuerySchema  // page, pageSize (coerce, defaults, max)

// Paginated envelope (move from admin-catalog.contract.ts)
createPaginatedResponseSchema(item)  // items, page, pageSize, total, totalPages
Paginated<T>
```

#### [MODIFY] contracts that already duplicate or own these

| File | Action |
| --- | --- |
| `admin-catalog.contract.ts` | Move `paginatedSchema` / `Paginated` here → re-export from common (or update imports) |
| `product.contract.ts` | Share overlapping base product field shapes where identical (name, images, rating, …) — **do not** merge admin-only cost fields into public DTOs |
| `shipment.contract.ts` | Reuse `PaginationQuerySchema` for `page` / `pageSize` |
| `order.contract.ts` / `admin-inventory.contract.ts` | Dedupe shared money/address snippet schemas if identical |

**Constraint:** public `ProductDTO` must never gain `basePrice` / cost fields.

---

### Phase 2 — Pagination helpers (highest ROI on services + repos)

#### [NEW] `src/server/utils/pagination.ts`

```ts
parsePaginationFromUrl(url, { defaultPageSize = 20, max = 100 })
normalizePagination({ page?, pageSize? }, defaults)  // clamp + offset
buildPaginatedResult({ items, total, page, pageSize })
```

Today the same two-liner is copied across:

**URL parse (services):**

- `admin-orders.service.ts`
- `admin-users.service.ts`
- `admin-bridal.service.ts`
- `admin-media.service.ts` (default 24)
- `admin-catalog.service.ts`
- `admin-activity.service.ts` (slightly stricter clamp)
- `bosta.service.ts` (shipments list)

**Clamp + offset (repos):**

- `orders.repo.ts`
- `shipments.repo.ts`
- `users.repo.ts`
- `bridal-requests.repo.ts`
- `products.repo.ts`
- `media.repo.ts` (default 24)

**Envelope** (`totalPages: Math.max(1, Math.ceil(total / pageSize))`) — same services as above.

> Original plan named `order.service.ts` + `inventory.service.ts` for `buildPaginationParams`. Storefront `order.service.ts` has **no** page/pageSize parsing; the real duplication is **admin list services + repos**. Prefer those call sites.

---

### Phase 3 — Order DTO mapping (largest single clone)

| Clone | Size | Files |
| --- | --- | --- |
| Order row → DTO mapping | ~27 lines / ~194 tokens | `order.service.ts` ↔ `admin-orders.service.ts` |

Shared mapping for: items, address, payment fields, totals, optional promo/note/timeline.

#### [NEW] `src/server/mappers/order.mapper.ts` (suggested)

- `mapOrderItems(items)`
- `mapOrderAddress(order)`
- `toOrderDTO(...)` / `toAdminOrderDTO(...)` wrapping shared core + admin-only fields (`userId`, etc.)

**Constraint:** keep admin vs storefront DTO types separate; only share the mapping helpers.

---

### Phase 4 — Admin list UI patterns (largest UI cluster)

Admin pages share list-shell patterns (toolbar empty state, loading/error blocks, `Pagination` footer):

Notable pairs (jscpd):

- `admin/bundles` ↔ `admin/promos` / `admin/locations`
- `admin/bridal` ↔ `admin/orders` / `admin/users` / `admin/media`
- `admin/media` ↔ `admin/orders` / `admin/products` / `admin/users` / `admin/shipments`
- `admin/products` ↔ `admin/users`

#### Suggested extractionsions (feature-local, not a new global design system)

Under `features/admin/components/`:

| Component / hook | Role |
| --- | --- |
| `AdminListPageShell` | Title row + optional toolbar slot + body |
| `AdminEmptyState` | Consistent empty copy + optional CTA |
| `AdminQueryState` | loading / error / empty branching |
| `useAdminListQueryParams` | `page`, `PAGE_SIZE`, `q` sync (repeated `const PAGE_SIZE = 20`) |

Do this **after** Phase 2 so list APIs stay consistent while UI is refactored.

---

### Phase 5 — Feature UI leftovers (medium)

| Clone | Location | Suggestion |
| --- | --- | --- |
| Order summary `<dl>` | `CartView` ↔ `CheckoutForm` | Small `OrderTotals` presentational component in cart (checkout imports via feature barrel) |
| Order items + address block | `OrderConfirmation` ↔ `OrderDetails` | Shared `OrderSummaryBlock` in `features/order/` |
| Cart inline skeleton vs `CartDrawerSkeleton` | `CartView` ↔ `skeleton/compositions.tsx` | Use `CartDrawerSkeleton` / composition instead of inline Skeleton markup |
| Login / Register imports + form chrome | `LoginForm` ↔ `RegisterForm` | Optional thin `AuthFormShell` (low priority — mostly imports) |

---

### Phase 6 — Shared UI / barrels (low priority — verify need)

#### Skeleton barrel “clone”

`shared/components/ui/index.ts` re-exports the same names as `skeleton/index.ts`.

This is **intentional barrel plumbing**, not business logic duplication. Options:

1. Leave as-is (document as known jscpd false-ish positive).
2. Replace enumerated list with `export * from './skeleton'` to shrink the file (same public API).

#### Tabs.tsx

jscpd flags ~11 lines between `TabsTrigger` and `TabsContent` (shared `useContext` + early throw). They are **not** duplicated focus/indicator logic; a sub-component here adds little value.

**Recommendation:** skip Tabs refactor unless combining with a real Tabs redesign.

---

### Phase 7 — Nice-to-have / intentional patterns (do not force)

| Pattern | Notes |
| --- | --- |
| Admin API route preamble | `requireAdmin` + method handlers look alike — acceptable Nest-style boilerplate; optional shared `withAdminRoute` only if it reduces noise without obscuring HTTP contracts |
| `bosta.service` ↔ `paymob.service` | Similar HTTP client wrappers — expected for integrations |
| Same-file clones in `inventory.service`, `product.service`, `bundle.service`, `DashboardView` | Prefer small private helpers inside the file |
| `jobs/config.ts` ↔ `settings.service.ts` | Settings key defaults — extract shared default map if still identical |
| `admin-catalog` ↔ `admin-stats` date bucketing | Shared `bucketByDay` util if still copy-pasted |
| `shop/loading.tsx` ≡ `shop/[category]/loading.tsx` | 3-line Next.js convention; fine to leave |

---

## Out of scope / already complete

- Deleting legacy `/login` and `/register` App Router pages
- Moving Header account link off legacy auth URLs
- Changing API response shapes or query param names
- Merging public and admin product DTOs into one schema

---

## Implementation order (recommended)

1. **`common.contract.ts`** + wire catalog / shipment / paginated consumers  
2. **`pagination.ts`** + services + repos  
3. **Order mapper** (`order.service` / `admin-orders.service`)  
4. **Cart/Checkout totals** + **Order summary** components  
5. **Admin list shell** extractionsions (incremental, page-by-page)  
6. Optional: `export * from './skeleton'`, jobs/settings defaults, inventory private helpers  
7. Skip: Tabs micro-refactor, auth route deletes, JSON fixture “clones”

---

## Verification plan

### Automated

```bash
# Code-only baseline (ignore JSON/SQL/CSS noise)
npx jscpd src --min-tokens 40 --ignore "**/*.json,**/*.sql,**/*.css"

pnpm typecheck
pnpm lint
pnpm assert:no-secrets
```

**Success target (directional):** drop TS/TSX clones from ~138 toward **≤100**, and duplicated lines from ~3.5% toward **≤2.5%**, without new typecheck/lint errors.

### Manual

1. Auth: `/auth/login`, `/auth/register`, unauthenticated `/account` redirect  
2. Storefront: shop catalog browse/search; cart → checkout totals match  
3. Admin: products, orders, users, bridal, media lists — pagination + filters still work  
4. Order confirmation + order details pages render items/address/totals correctly  

---

## Appendix — top cross-file clones (actionable)

| Lines / tokens | Pair |
| --- | --- |
| 27 / 194 | `admin-orders.service.ts` ↔ `order.service.ts` (DTO map) |
| 15 / 105 | `jobs/config.ts` ↔ `settings.service.ts` |
| 16 / 105 | `admin-catalog.service.ts` ↔ `admin-stats.service.ts` |
| 25 / 91 | `admin/bundles/page.tsx` ↔ `admin/promos/page.tsx` |
| 13 / 91 | `admin-ops.service.ts` ↔ `admin-shipments.service.ts` (client) |
| 8 / 85 | `admin-catalog.contract.ts` ↔ `product.contract.ts` (product fields) |
| 23 / 79 | `OrderConfirmation.tsx` ↔ `OrderDetails.tsx` |
| 18 / 78 | `admin/media/page.tsx` ↔ `admin/orders/page.tsx` |
| Repeated 6–10 L | URL `page`/`pageSize` parse across 7 admin list services |

Full machine report: `.jscpd-report/jscpd-report.json` (local; gitignore if desired).
