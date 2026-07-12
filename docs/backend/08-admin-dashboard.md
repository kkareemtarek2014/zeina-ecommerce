# 08 — Admin Dashboard

A production-ready admin dashboard to manage **only the entities that exist** in Zaya. It sits on top of
the same Cloudflare backend (Workers + D1 + R2) and the same D1-session auth, gated to `admin` role.
The storefront UI/UX is **unchanged**; the dashboard is a new, separate surface under `/admin`.

> Prereq: this builds on `00`–`07`. The catalog/orders/users/locations tables already exist; the admin
> layer adds **write** operations, an `admin` role, a settings store, and the dashboard UI.

---

## 1. What is manageable (derived from the project — nothing invented)

| Module | Backing data (already in the project) | Operations |
| --- | --- | --- |
| **Dashboard** | `orders`, `products`, `order_items` | stats (counts, revenue), recent orders, latest products, sales summary |
| **Products** | `products` + `categories` + R2 images | list (search/filter/paginate), create, edit, delete, image upload/replace/delete. **Enhanced (`10`):** drafts/status, SEO fields, slug/SKU, duplication, bulk actions, CSV import/export, media library, rich-text description, archive/restore |
| **Inventory** ⭐ | `products.stock_qty` + `inventory_movements` | stock adjustments with reason, movement history, low-stock warnings, reserved stock (`10` §1) |
| **Categories** | `categories` | list, create, edit, delete |
| **Orders** | `orders` + `order_items` (+ later `payments`, `shipments`) | **P10:** list (search/filter/paginate), details, update status (validated transitions). **P13–P14 (`09`):** view Paymob payment rows + create/refresh Bosta shipment/tracking |
| **Users** | `users` | list, view, edit (name/phone/role), delete |
| **Locations** | `governorates`, `shipping_zones` | manage governorates (name, zone), edit zone delivery fees + free-shipping threshold |
| **Promo codes** | `promos` | list, create, edit, activate/deactivate, delete |
| **Bridal requests** | `bridal_requests` (+R2 media) | list, view media, mark answered |
| **Settings** | `settings` (new key-value) | profit margin, shipping rates, free-shipping threshold, site meta. **Enhanced (`10` §18):** logo/favicon, contact + social + WhatsApp, SEO defaults, footer, maintenance mode |
| **Customers** | `users` + derived | Customer 360: total orders/spent, last order, favorites, addresses (`10` §13) |
| **Notifications / Activity** | `notifications` + `audit_log` | bell (new order, low stock, payment failed, bridal) + activity feed (`10` §10/§16/§20) |
| **Roles & permissions** | `users.role` (+ perms) | Admin/Manager/Order/Product/Content roles (`10` §19) |

> **Production enhancements** — inventory history, order timeline, dashboard analytics, drafts, SEO,
> duplication, bulk actions, CSV, media library, notifications, coupon usage, soft-delete, RBAC, activity
> feed, and **Cron Triggers** — are specified in **`10-enhancements.md`** (phases P16–P22). The top-5
> (⭐ inventory, order timeline, bulk actions, duplication, audit log) build first.

> **Sourcing, pricing & merchandising** — the **Temu Importer** (paste URL → draft product via a scraper
> API), the **landed-cost dynamic pricing engine** (USD base + customs/VAT/handling/FX → 50% margin),
> real-time **stock sync**, **bundles**, **pre-orders**, shipping-timeline settings, and social proof —
> are specified in **`11-sourcing-pricing-merchandising.md`** (phases P24–P26). Admin gains an Importer
> tool, a Bundles module, Pre-order management, and Pricing settings.

Not built (no data exists): product **variants** (the `Product` type has none — do **not** add a variants
UI), gift cards, multi-warehouse, tax. Product "variants" from the generic prompt is intentionally
**skipped** because the schema has no variant concept.

> **Reuse note:** dashboard stats, recent orders, latest products, and sales summary are all derived
> from existing tables — no new data model is required for them.

---

## 2. Auth & authorization

Reuse the existing session mechanism (`02` §2.6, `03` §2). Add a **role** to `users`:

- `users.role: 'customer' | 'admin'` (default `customer`). See `02` §2.5 update.
- `requireAdmin(req)` = `requireAuth` + assert `role === 'admin'`, else `FORBIDDEN` (403).
- All `/api/admin/**` routes call `requireAdmin`. `/admin/**` pages are wrapped in an `AdminGuard`
  (client) that also confirms role via `GET /api/auth/me` (which now returns `role`).
- `middleware.ts`: add `/admin` to protected matching; unauthenticated → redirect to `/admin/login`
  (or reuse `/auth/login` with a `redirect` param). Non-admins hitting `/admin` → 403 page.
- **Seed an admin**: `admin@zaya-eg.com` (hashed) with `role='admin'` (see `02` §6 update). Never
  ship a default password to production — force a reset or set via secret on first deploy.

No separate admin user table — one `users` table, role-scoped. Matches "reuse existing types".

---

## 3. Admin API contracts (all under `/api/admin`, `requireAdmin`, envelope from `03` §1)

Shared list query params: `?page=1&pageSize=20&q=&sort=&...filters`. List responses are paginated:
```ts
type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
```

### Dashboard
- `GET /api/admin/stats` →
  ```ts
  { revenueTotal: number; ordersCount: number; productsCount: number; usersCount: number;
    ordersByStatus: Record<OrderStatus, number>;
    recentOrders: AdminOrderDTO[];        // last 5 (+ userId)
    latestProducts: AdminProductDTO[]; // last 5
    salesByDay: { date: string; total: number }[]; // last 14 UTC days; exclude cancelled
  }
  ```
  `revenueTotal` / daily totals exclude `cancelled` orders.
### Products (`AdminProductDTO` includes `basePrice` — admin-only, never on storefront)
- `GET /api/admin/products` — query `q`, `category`, `inStock`, `featured`, `sort`, `page`, `pageSize` → `Paginated<AdminProductDTO>`.
- `POST /api/admin/products` — body = full product (name, categorySlug, **basePrice**, compareAtPrice?, description, images[], inStock, featured, tags[]). Server derives `price`. → 201 `AdminProductDTO`.
- `GET /api/admin/products/[id]` → `AdminProductDTO`.
- `PUT /api/admin/products/[id]` → updated `AdminProductDTO`.
- `DELETE /api/admin/products/[id]` → `{ ok:true }` (block or cascade if referenced by orders — see §6).
- `POST /api/admin/products/[id]/images` — `multipart/form-data`, one/more image/video files → uploads to R2 (`products/{id}/{uuid}`), appends URLs to `images`. → updated `images[]`.
- `DELETE /api/admin/products/[id]/images` — body `{ url }` → removes from `images` and deletes the R2 object.

### Categories
- `GET /api/admin/categories` → `Category[]`.
- `POST /api/admin/categories` — `{ slug, name, image?, seoDescription, sortOrder? }` → 201.
- `PUT /api/admin/categories/[slug]` → updated. `DELETE /api/admin/categories/[slug]` (block if products reference it → `CONFLICT`).
- `POST /api/admin/categories/[slug]/image` — multipart → R2 → sets `image`.

### Orders
- `GET /api/admin/orders` — query `q` (id/phone/name), `status`, `governorate`, `dateFrom`, `dateTo`, `page`, `pageSize` → `Paginated<AdminOrderDTO>` (`OrderDTO` + `userId`).
- `GET /api/admin/orders/[id]` → `AdminOrderDTO` (with items).
- `PATCH /api/admin/orders/[id]/status` — `{ status: OrderStatus }` (validate transition — see §6) → updated `AdminOrderDTO`. (Orders are **not** created/deleted from admin — they come from checkout.)
- **Deferred to P13–P14 (`09`):** `POST/GET /api/admin/orders/[id]/shipment`, `GET /api/admin/shipments`, Paymob payment-row UI. P10 still shows `paymentMethod` / `paymentStatus` already on the order row.

### Users
- `GET /api/admin/users` — `q` (email/name/phone), `role`, `page`, `pageSize` → `Paginated<AdminUserDTO>` (`id,email,name,phone,role,createdAt,ordersCount`).
- `GET /api/admin/users/[id]` → `AdminUserDTO` + `recentOrders` (≤10).
- `PUT /api/admin/users/[id]` — `{ name?, phone?, role? }` → updated. (Email immutable; can't demote self or the last admin.)
- `DELETE /api/admin/users/[id]` — block deleting self / last admin; DB cascades favorites/addresses/sessions/wallet; orders/reviews/bridal `user_id` → null. → `{ ok:true }`.

### Locations
- `GET /api/admin/governorates` → `GovernorateDTO[]`.
- `POST /api/admin/governorates` — `{ id, name, zone }` (zone ∈ shipping_zones). `PUT /[id]` — `{ name?, zone? }`.
  `DELETE /[id]` (block if used by orders/addresses → `CONFLICT`).
- `GET /api/admin/shipping-zones` → `{ zone, label, fee }[]`.
- `PUT /api/admin/shipping-zones/[zone]` — `{ fee }` (≥ 0) → updates delivery fee. Zones are fixed (no CRUD on zone keys).

### Promos
- `GET /api/admin/promos` → `AdminPromoDTO[]`. `POST` create, `PUT /[code]` edit (code immutable), `DELETE /[code]`,
  `PATCH /[code]` `{ active }` toggle.

### Bridal requests
- `GET /api/admin/bridal-requests` — `status`, `page`, `pageSize` → `Paginated<AdminBridalRequestDTO>`
  (`mediaUrl` via `/api/media/…` when `fileKey` set).
- `GET /api/admin/bridal-requests/[id]`, `PATCH /[id]` `{ status: 'pending'|'answered' }`. No delete in P11.

### Settings
- `GET /api/admin/settings` → `{ profitMargin, freeShippingThreshold, siteName, siteTagline, siteUrl }`.
- `PUT /api/admin/settings` — partial update; `profitMargin` clamped 0.20–0.30; threshold ≥ 0.
  **Pricing/shipping services read effective settings** (DB overrides `site.config.ts` defaults).
  Logo/SEO/social/maintenance = later (`10` §18).

### Storefront config (public, P11)
- `GET /api/storefront-config` → `{ freeShippingThreshold, shippingZones: { zone, label, fee }[] }` —
  powers checkout/cart shipping preview. Never includes `profit_margin`.

Every write is validated with a Zod schema in `shared/contracts/admin.*`, returns the standard envelope,
and (optionally) writes an `audit_log` row (`02` §2.16).

---

## 4. Data-model additions (see `02` for full detail)

- `users.role` column (`customer|admin`, default `customer`).
- **`settings`** table — key-value config editable at runtime (margin, thresholds, site meta).
- **`shipping_zones`** table — `zone` PK, `label`, `fee` (delivery fee, formerly `SHIPPING_RATES`).
  Governorate→zone mapping stays on `governorates`.
- **`audit_log`** (optional but recommended) — who changed what, when (`actor_id`, `action`, `entity`,
  `entity_id`, `meta`, `created_at`). Powers "logging where useful".

Pricing (`getSellPrice`) and shipping now read **effective settings**: DB value if present, else the
`site.config.ts` constant. Keep the constants as defaults/fallbacks so nothing breaks pre-seed.

---

## 5. Dashboard frontend

Follows the existing design system exactly — tokens in `styles/tokens.css` (deep rose `--brand-primary`,
gold accent, blush surfaces), `--font-display` (Playfair) for headings, existing UI primitives.

### Folder structure
```
src/
├── app/admin/
│   ├── layout.tsx                 # AdminGuard + AdminShell (sidebar + topbar + breadcrumbs)
│   ├── login/page.tsx             # admin login (reuses auth)
│   ├── page.tsx                   # dashboard (stats)
│   ├── products/{page, new, [id]/edit}
│   ├── categories/page.tsx
│   ├── orders/{page, [id]}
│   ├── users/{page, [id]}
│   ├── locations/page.tsx         # governorates + shipping zones tabs
│   ├── promos/page.tsx
│   ├── bridal-requests/{page, [id]}
│   └── settings/page.tsx
│
├── features/admin/
│   ├── components/
│   │   ├── AdminShell.tsx  Sidebar.tsx  Topbar.tsx  Breadcrumbs.tsx
│   │   ├── StatCard.tsx    SalesChart.tsx  RecentOrders.tsx
│   │   ├── ProductForm.tsx CategoryForm.tsx  OrderStatusSelect.tsx
│   │   ├── UserForm.tsx    ShippingZoneForm.tsx  SettingsForm.tsx
│   │   └── ImageUploader.tsx      # drag/drop → R2 (reuses api.postForm)
│   ├── hooks/                     # React Query queries + mutations (one file per module)
│   │   ├── useAdminProducts.ts  useAdminOrders.ts  useAdminUsers.ts
│   │   ├── useAdminCategories.ts useAdminStats.ts   useAdminSettings.ts
│   │   └── useAdminLocations.ts  useAdminPromos.ts  useAdminBridal.ts
│   ├── services/admin.service.ts  # typed api calls (thin over shared/lib/api-client)
│   ├── schema/                    # admin Zod schemas (reuse shared/contracts)
│   ├── guard/AdminGuard.tsx
│   └── index.ts                   # barrel
│
└── shared/components/ui/          # NEW reusable primitives (admin + future)
    ├── DataTable.tsx              # generic table: columns, sorting, empty/loading
    ├── Pagination.tsx
    ├── Dialog.tsx / ConfirmDialog.tsx   # built on existing Drawer/focus-trap hooks
    ├── Toast.tsx + ToastProvider  # notifications
    ├── Tabs.tsx  and  SearchInput.tsx
```

### Reused vs. new UI
- **Reuse:** `Button`, `Input`, `Select`, `Badge`, `Loader`, `Drawer`, and hooks `useFocusTrap`,
  `useEscapeKey`, `useScrollLock`, `useHydrated`. Same tokens/typography/animations (CSS-only).
- **New (admin-serving, additive — does not touch storefront):** `DataTable`, `Pagination`,
  `Dialog`/`ConfirmDialog`, `Toast`/notifications, `Tabs`, `SearchInput`. Put in `shared/components/ui`
  so they're reusable and consistent with the design system.

### UX requirements (from the brief)
Responsive sidebar (collapsible on mobile), topbar with admin identity + logout, breadcrumbs on every
page, React Query loading/skeleton states, react-hook-form + Zod validation on all forms, confirmation
dialogs for destructive actions (delete product/category/user, deactivate promo), debounced search,
filter controls, pagination, and toast notifications on success/error. All accessible (aria-labels, real
`<label>`s), mobile-first.

---

## 6. Business rules & guards (server-side, authoritative)

- **Referential safety:** deleting a category with products → `CONFLICT`; deleting a governorate used by
  orders/addresses → `CONFLICT`; deleting a product referenced by `order_items` → soft-handle (block, or
  set `in_stock=false` + keep the row so order history stays intact). Pick "block with clear message".
- **Order status transitions:** forward **one step only** along
  `placed→confirmed→sourced→shipped→out_for_delivery→delivered`. `cancelled` from any state except
  `delivered` / already `cancelled`. Reject skips, backwards moves, and edits to terminal statuses
  (`VALIDATION`). (Full history table = `10-enhancements` ⭐ timeline — not P10.)
- **Admin safety:** cannot delete/demote self or the last remaining admin (`CONFLICT`).
- **Settings validation:** profit margin clamped to 0.20–0.30 (business rule); fees ≥ 0.
- **Prices:** admin sees/edits `basePrice`; storefront DTO still strips it. `price` always recomputed.
- **Every mutation** may write `audit_log` (actor, action, entity, before/after summary).

---

## 7. Image uploads (R2)

Reuse the R2 bucket `zaya-uploads` (`UPLOADS` binding) and `upload.service` from `06`.
- Products: `products/{productId}/{uuid}.{ext}`; store the served URL in `products.images[]`.
- Categories: `categories/{slug}/{uuid}.{ext}` → `categories.image`.
- Serve via a public R2 route (`/api/media/[...key]`) or R2 public bucket URL; store the final URL in D1.
- Replace = upload new + delete old object; Delete = remove from array + delete object. Validate
  mime (image/\*) and size (reuse the 25 MB cap or a tighter image cap, e.g. 5 MB).
- Seeded products keep their existing `/images/*.svg` paths until an admin replaces them.

---

## 8. Seeders (critical — no data loss)

Extends `02` §6 / `06` Phase 1 seeder so **every** static dataset lands in D1 and the storefront needs
zero manual entry:
- `CATEGORIES` (7) → `categories`.
- `PRODUCTS` (12) → `products` (with `basePrice`, order preserved for new-arrivals).
- `GOVERNORATES` (27) → `governorates`.
- `SHIPPING_RATES` → `shipping_zones` (`cairo_giza=50, near=80, far=100`) + `FREE_SHIPPING_THRESHOLD`
  and `PROFIT_MARGIN` → `settings`.
- `PROMOS_DB` (2) → `promos`.
- `SEED_USERS` (1) → `users` (role `customer`, re-hashed) **+ one seeded admin** (role `admin`).
- Static reviews (`ProductReviews.tsx`) → `reviews`; wallet seed → `wallet_transactions`.
- The `ZN-MOCK-123` sample order in `orders.store.ts` → `orders` + `order_items` (so the dashboard has a
  sample order to show). Idempotent `INSERT OR IGNORE`. One command: `pnpm db:seed`.

After `db:seed`, the dashboard lists all products, categories, locations, the promo codes, the seed
users, and the sample order — matching what the frontend shows today.

---

## 9. Admin phases (continues `05-plan.md`)

- **P8 — Admin auth & shell:** `users.role`, `requireAdmin`, `AdminGuard`, `AdminShell` (sidebar/topbar/
  breadcrumbs), admin login, seed admin. New UI primitives (`DataTable`, `Pagination`, `Dialog`,
  `Toast`, `Tabs`, `SearchInput`). **Verify:** admin logs in, non-admin gets 403, shell renders responsive.
- **P9 — Products & Categories CRUD + images:** admin product/category APIs + R2 image upload; list
  (search/filter/paginate), create/edit/delete forms, confirm dialogs. **Verify:** create→appears on
  storefront; edit price/stock reflects; image upload lands in R2; delete guarded by references.
- **P10 — Orders & Users:** admin orders (list/filter/detail/status; one-step + cancel rules) + users
  (list/view/edit/delete with self/last-admin guards). **Out of P10:** Bosta/Paymob admin (`09`),
  `order_status_history`, `audit_log`. **Verify:** illegal status rejected; user edits persist;
  last-admin/self guards.
- **P11 — Locations, Promos, Bridal, Settings:** governorates + shipping-zone fees; promo CRUD;
  bridal review; settings (margin 0.20–0.30); `computeSellPrice` + checkout preview read effective
  config; public `GET /api/storefront-config`. **Out:** audit_log, site chrome/SEO settings,
  landed-cost. **Verify:** zone fee → checkout shipping; margin → storefront prices.
- **P12 — Dashboard stats + hardening:** `/api/admin/stats` + live dashboard (StatCards, CSS sales
  chart, recent orders, latest products); **new** `audit_log` migration + write-on-mutation (no
  viewer yet); rate-limit `/api/admin/**` (60/min/IP). **Out:** audit viewer/bell (`10`). **Verify:**
  stats match DB; migrate + ⏳ deploy smoke.

## 10. Admin task checklist

**P8** *(revision locked in `06-tasks.md` — role column already exists; no new migration)*
- [x] Confirm `users.role` + seed admin; `auth/me` returns `role`.
- [x] `auth/require-admin.ts`; `GET /api/admin/health` (smoke); wrap future `/api/admin/**`.
- [x] `AdminGuard`, `AdminShell` (Sidebar, Topbar, Breadcrumbs); `/admin/login` + 403.
- [x] New primitives: `DataTable`, `Pagination`, `Dialog`/`ConfirmDialog`, `Toast`+provider, `Tabs`, `SearchInput`.
- [x] `middleware.ts` cookie-gates `/admin`. [V] admin-in / non-admin-403 / responsive shell.

**P9** *(revision locked in `06-tasks.md` — published-by-default; flat margin; image ≤5MB; hard delete + CONFLICT)*
- [x] Product admin API (list/create/read/update/delete, image add/remove) + `AdminProductDTO`.
- [x] Category admin API + image + `AdminCategoryDTO`.
- [x] `ProductForm`, `CategoryForm`, `ImageUploader`, product/category list pages (search/filter/paginate + confirm delete).
- [ ] ⏳ [V] create shows on storefront; delete blocked when referenced; images in R2.

**P10** *(revision locked in `06-tasks.md` — one-step status + cancel; AdminOrderDTO+userId; no Bosta/Paymob/audit)*
- [x] Orders admin API (list/filter/detail/status transition) + pages.
- [x] Users admin API (list/view/edit/delete + guards) + pages.
- [ ] ⏳ [V] status transitions validated; last-admin/self guards.

**P11** *(revision locked in `06-tasks.md` — effective settings; public storefront-config; no audit/logo/landed-cost)*
- [x] Locations: governorates CRUD + shipping zones fee edit; pricing/shipping read effective settings.
- [x] Promos CRUD; Bridal requests review; Settings form (margin 0.20–0.30 clamp).
- [x] Public `GET /api/storefront-config`; checkout preview uses it.
- [ ] ⏳ [V] zone-fee change alters checkout shipping; margin change alters storefront prices.

**P12** *(revision locked in `06-tasks.md` — AdminStatsDTO; audit write-only; admin 60/min rate-limit; CSS chart)*
- [x] `audit_log` migration + `writeAuditLog` on admin mutations (no viewer).
- [x] `GET /api/admin/stats`; dashboard cards + sales chart + recent orders/latest products.
- [x] Rate-limit `/api/admin/**` (60/min/IP).
- [ ] ⏳ [V] stats match DB; migrate remote + deploy smoke.

## 11. Definition of done
Admin can manage products, categories, orders, users, locations, promos, bridal requests, and settings;
all existing mock data is seeded (no manual entry); the storefront renders identically from D1;
`pnpm build && pnpm typecheck && pnpm lint` clean; deployed on the Cloudflare account
`kkareemtarek2@gmail.com`.
