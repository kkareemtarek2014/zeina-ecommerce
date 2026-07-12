# 06 — Task Checklist (per phase)

Granular, checkable tasks. Each is small enough to implement + verify in one sitting. Check as you go.
`[V]` = verification task (do not skip).

---

## Phase 0 — Setup
> **Reviewed 2026-07-12 — code/config complete; `typecheck` + `lint` green.** Config uses
> `wrangler.jsonc` (not `.toml`) with D1 `DB` + R2 `UPLOADS`; env typing is `cloudflare-env.d.ts` (via
> `cf-typegen`). ⏳ = still needs a live run on your machine (I can't run wrangler/D1 in review).
- [x] Install: `@opennextjs/cloudflare`, `wrangler`, `drizzle-orm`, `drizzle-kit` (workers types via `cf-typegen`).
- [x] `wrangler login` (account `kkareemtarek2@gmail.com`) — D1/R2 resources exist under it.
- [x] `wrangler d1 create zaya-db` → `database_id` `dafeb5da-…` wired in `wrangler.jsonc`.
- [x] `wrangler r2 bucket create zaya-uploads` (binding `UPLOADS`).
- [x] `SESSION_SECRET` + `PASSWORD_PEPPER` in `.dev.vars` locally. ⏳ also `wrangler secret put` before `deploy`.
- [x] `wrangler.jsonc` with `d1_databases` (binding `DB`) and `r2_buckets` (binding `UPLOADS`).
- [x] `open-next.config.ts`, `drizzle.config.ts`, `cloudflare-env.d.ts` (`CloudflareEnv` with DB/UPLOADS/secrets).
- [x] Scripts: `preview`, `deploy`, `db:generate`, `db:migrate:local`, `db:migrate:remote`, `db:seed`.
- [x] Temp `GET /api/health` route — created and correctly removed after.
- [ ] ⏳ [V] `pnpm build` + `preview` boots (needs the OpenNext/Cloudflare build locally). `typecheck`/`lint` already green.

## Phase 1 — DB layer
> **Reviewed 2026-07-12 — complete.** Schema/migration/seed all present; seed publishes products
> (`status='published'`, `stockQty=50`), hashes both users (customer + admin), and inserts reviews,
> wallet, shipping-zones, settings, and the sample order (with a real product id). Idempotent.
- [x] Schemas: all 14 tables (`categories, products, governorates, promos, users, sessions, orders, order_items, addresses, favorites, reviews, wallet_transactions, bridal_requests` + settings/shipping_zones) + `index.ts` barrel.
- [x] `db/client.ts` (`getDb`) + `db/request.ts` (cached `getRequestDb` via OpenNext context).
- [x] `http/envelope.ts` (`ok`/`fail`), `http/errors.ts` (`AppError` + subclasses), `http/handler.ts` (`withHandler`).
- [x] `shared/contracts/`: `envelope, errors, product, order, auth, promo, review, account` (+ `api-client`).
- [x] `db:generate` → migration `0000_…sql`. ⏳ run `db:migrate:local` on your machine.
- [x] `db/seed.ts` porting all `shared/data` (+ hashed users, admin, reviews, wallet, shipping_zones, settings, sample order).
- [ ] ⏳ [V] Run `db:migrate:local` + `db:seed`, then confirm row counts: products 12, categories 7, governorates 27, promos 2, users 2, shipping_zones 3, ≥1 order; users hashed.

## Phase 2 — Catalog reads
> **Reviewed 2026-07-12 — complete.** `toProductDTO` maps rows → DTO and **never** exposes `basePrice`
> (verified); all reads filter `status='published'`. Client `Product`/`Category` are now the contract
> DTOs; components use `product.price`.
- [x] `products.repo`, `categories.repo`, `governorates.repo`.
- [x] `server/services/product.service.ts` row→`ProductDTO` mapper (no `basePrice`; `price` via `computeSellPrice`).
- [x] Routes: `products`, `products/[id]`, `products/[id]/related`, `products/new`, `products/search`, `categories`, `governorates` (+ `?category&featured&sort&q`).
- [x] Rewrote `features/shop/services/products.service.ts` bodies → `api` calls.
- [x] `basePrice`/`getSellPrice` removed from components + `cart.store` (use `product.price`); `Product = ProductDTO`.
- [x] RSC pages call the server product service; `generateMetadata`/JSON-LD/`generateStaticParams` intact.
- [x] [V] `typecheck` + `lint` clean; DTO mapper guarantees no `basePrice` in responses. ⏳ eyeball the pages after `db:seed`.

## Phase 3 — Auth
> **Reviewed 2026-07-12 — complete.** PBKDF2 (100k, constant-time verify); opaque token in httpOnly
> cookie with only its SHA-256 stored; `toUserDTO` excludes `passwordHash` (verified). Login uses a
> generic error (no enumeration); forgot-password always returns ok. `Secure` flag set on https.
- [x] `auth/password.ts` (PBKDF2 hash/verify, constant-time), `auth/session.ts` (token/cookie helpers), `auth/require-auth.ts`.
- [x] `users.repo`, `sessions.repo`, `server/services/auth.service.ts`.
- [x] Routes: `auth/register`, `auth/login`, `auth/logout`, `auth/me`, `auth/forgot-password`.
- [x] Rewrote `features/auth/services/auth.service.ts` → `api`; added `useLogin/useRegister/useForgotPassword/useLogout/useSession`.
- [x] Deleted `users.store`; session hydrated from `/api/auth/me` (`SessionHydrator`/`useSession`); `AuthGuard` confirms session.
- [ ] ⏳ [V] Live flows (register→auto-login cookie; seed login; bad creds 401; protected redirect; refresh persists; logout clears). Code verified; no `password_hash` in DTOs.

## Phase 4 — Promo + Orders
> **Revision notes (locked):** free shipping uses subtotal **before** discount; checkout must
> send `promoCode` (client previously dropped it); UI stays COD-only while API enum allows
> card/wallet for P13; client `Order` = `OrderDTO` (includes `discount`/`promoCode`/`paymentStatus`);
> shipping fees from D1 `shipping_zones` with `site.config` fallback.
> **Reviewed 2026-07-12 — complete.** `order.service` recomputes unit prices (`computeSellPrice`),
> subtotal, promo discount, and shipping server-side (client prices ignored); validates governorate +
> stock; guests may place COD; card/wallet rejected until P13. Shipping reads D1 `shipping_zones` with
> `site.config` fallback; free shipping keyed on pre-discount subtotal.
- [x] `promo.service` + `POST /api/promos/validate`; cart `applyCoupon` → API.
- [x] `order.service` (recompute prices, subtotal, discount, shipping, total), `orders.repo`, `order_items` writes.
- [x] Routes: `POST /api/orders` (guest ok), `GET /api/orders/[id]`, `GET /api/orders` (auth).
- [x] `usePlaceOrder`; `CheckoutForm.onSubmit` → mutation; removed `ordersStore.placeOrder` + mock order.
- [ ] ⏳ [V] Live order (server totals with tampered client prices ignored; zone shipping + free≥1500; promo; `/order/[id]` + account list). Code verified.

## Phase 5 — Account
> **Revision notes (locked, vs CLAUDE.md + `03`/`04`):**
> - Profile lives on `users` (`name`/`phone`); email immutable; drop `Zaya-profile` store.
> - Addresses: DTO field `governorate` ↔ DB `governorate_id`; ownership enforced on DELETE.
> - Favorites: guests keep `Zaya-favorites` localStorage; on login `PUT` guest ids (replace set),
>   then treat server as source of truth while authenticated (toggle also PUTs when logged in).
> - Wallet: balance = Σcredit − Σdebit (never trust stored balance); flag `wallet` OFF →
>   page 404 via middleware **and** `GET /api/account/wallet` → 404; drop `Zaya-wallet` persist.
> - Reuse `requireAuth` + `account.contract.ts`; vouchers page out of scope (no API in docs).
- [x] Repos + routes: profile (get/put), addresses (get/post, `[id]` delete), favorites (get/put), wallet (get, flag-gated 404).
- [x] Hooks: `useProfile/useUpdateProfile`, `useAddresses/useAddAddress/useRemoveAddress`, `useFavoritesSync`, `useWallet`.
- [x] Rewire `ProfileForm`, `AddressBook`, `FavoritesGrid`, `MyWallet`; favorites PUT-sync on login.
- [x] [V] Profile persists; address add/delete (ownership enforced); favorites sync; wallet balance = Σcredit−Σdebit; wallet route 404 when flag off.

## Phase 6 — Bridal + R2 + Reviews
> **Revision notes (locked, vs CLAUDE.md + `03`/`04`/`01`):**
> - Bridal is **public** (guest OK); if session present, set optional `user_id` (same soft-auth as orders).
> - File: ≤25 MB → `PAYLOAD_TOO_LARGE` **413**; MIME must start with `image/` or `video/` → else
>   `VALIDATION` **400**. R2 key `bridal/{id}/{sanitizedFilename}` via binding `UPLOADS`. No media
>   read route in P6 (store `file_key` only). Empty `weddingDate` → `null`.
> - Response 201: `{ id, status, createdAt }`. Add `bridal.contract.ts`. Drop `Zaya-bridal-requests`
>   persist; success UI from mutation response + React state only.
> - Reuse feature `bridalRequestSchema` text fields server-side; validate file size/MIME after
>   `request.formData()` (Workers `File` ≠ browser Zod file custom cleanly).
> - Reviews: `GET` public by `productId`; summary (avg/count/breakdown `"1"`…`"5"`) computed from
>   rows. `POST` auth-only, no UI; `authorName` = session user name; denormalized recompute of
>   `products.rating` / `review_count` (1 decimal). Helpful button display-only (no increment API).
> - `ProductReviews` takes `productId`; live UI shows seed truth for `p-001` (not fake 4.8/124).
- [x] `upload.service` (R2 put/get), `bridal-requests.repo`, `POST /api/bridal-requests` (multipart, ≤25MB, image/video).
- [x] `useSubmitBridalRequest` (multipart); wire `BridalRequestForm`.
- [x] `reviews.repo` + `GET /api/reviews?productId=`; rewire `ProductReviews` (list + average + breakdown bars). `POST /api/reviews` (auth, no UI).
- [x] [V] Bridal submit → DB row + R2 object; oversized/wrong-type rejected (413/400); reviews render from DB with correct summary; recompute updates product rating/count.

## Phase 7 — Hardening & deploy
> **Revision notes (locked, vs CLAUDE.md + `07-checklist` / `01` / `05`):**
> - **Audit:** every write already Zod-validated in services (keep that pattern); every route via
>   `withHandler` → envelope; add a short audit comment in `API.md`. Product GET queries stay
>   light (no body Zod required).
> - **Secrets leak:** `toProductDTO` / `toUserDTO` are the authority; add `pnpm assert:no-secrets`
>   (rg over `src/` serializers + client) — sitemap/`products.data` seed file may still contain
>   `basePrice` server-side; fail only if `basePrice`/`passwordHash` appear under `src/app/api` or
>   DTO/mapper exports. Client bundle check: no `basePrice` string in feature client code.
> - **Rate limit:** **in-memory** sliding window (no KV binding in P7 — `01` says KV later). Scope:
>   `POST` auth `login`/`register`/`forgot-password` + `POST` bridal only (not `me`/`logout`).
>   Limit ~20 / 60s / IP → `RATE_LIMITED` 429. Best-effort per isolate (acceptable for “basic”).
> - **Security headers** (via `next.config` `headers()` for all routes): `X-Content-Type-Options`,
>   `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` (cam/mic/geo off). Keep
>   `_headers` cache for `/_next/static/*`. No strict CSP in P7 (SVG placeholders).
> - **API.md:** storefront live contract only (from `03`); short “Admin planned — see `08`” pointer.
> - **SITE.url:** leave placeholder until domain purchased; note in CLAUDE/`API.md`.
> - **Remote:** `db:migrate:remote` → `wrangler secret put` SESSION_SECRET + PASSWORD_PEPPER →
>   `pnpm deploy`. Remote seed: `pnpm db:seed:remote` (wrangler D1 `--remote` batches; idempotent
>   `onConflictDoNothing` — **no wipe**). Prod passwords still seed defaults — change before public
>   go-live (not a P7 blocker).
> - **[V]:** checklist sections for storefront P0–P7 + build gates + Cloudflare + Security + API
>   quality; Admin/Integrations/Enhancements/Sourcing rows stay unchecked (later phases).
- [x] Audit: every write validated with a contract schema; every route returns the envelope; errors mapped to codes.
- [x] Ensure `basePrice` & `password_hash` never serialized (add a serialization test/grep).
- [x] Basic rate-limit on `auth/*` + bridal (optional KV); security headers.
- [x] `db:migrate:remote` + seed remote D1; set secrets; `deploy`.
- [x] Smoke test production URL; verify cart/checkout/order still `noindex`.
- [x] Write `API.md` at repo root (CLAUDE.md TODO); update `SITE.url` if domain purchased.
- [x] [V] Full `07-checklist.md` passes against deployed Worker (storefront P0–P7 sections; later-phase rows remain open).

## Phases 8–12 — Admin dashboard
The full, granular admin task list lives in **`08-admin-dashboard.md` §10**. Do those after P0–P7
are green. Pricing/shipping must read **effective settings** once P11 lands.

### Phase 8 — Admin auth & shell
> **Revision notes (locked, vs CLAUDE.md + `08` / `01` / `03`):**
> - **P8 scope only:** auth + shell + shared admin UI primitives. **No** products/categories CRUD,
>   orders/users APIs, settings UI, or live stats (P9–P12). `/admin` home = placeholder dashboard.
> - **`users.role`:** already in schema/seed/`UserDTO` (P1/P3). P8 does **not** add a new migration;
>   confirm `me` returns `role` and wire guards.
> - **Login:** dedicated `/admin/login` reusing the same httpOnly session + `POST /api/auth/login`.
>   Unauthenticated `/admin/**` → `/admin/login?redirect=…`. Authenticated non-admin → 403 page.
> - **RBAC:** only `customer | admin` (`requireAdmin` = `role === 'admin'`). Expanded roles later (`10`).
> - **Protection:** middleware cookie gate for `/admin` (Edge — no D1); authoritative role check in
>   client `AdminGuard` (`/api/auth/me`) + server `requireAdmin` on every `/api/admin/**`.
> - **UI:** `src/features/admin/` + `src/app/admin/**`; same storefront tokens (no separate theme).
>   Implement **all** §10 P8 primitives now (`DataTable`, `Pagination`, `Dialog`/`ConfirmDialog`,
>   `Toast`+provider, `Tabs`, `SearchInput`) for P9 composition. Toast provider in admin layout.
> - **APIs:** add `requireAdmin` now; optional tiny `GET /api/admin/health` for smoke (no CRUD).
> - **No admin feature flag** — gated by role only. `audit_log` / effective settings = P12 / P11.
- [x] Confirm `users.role` + seed admin + `auth/me` returns `role` (no new migration).
- [x] `auth/require-admin.ts`; `GET /api/admin/health` (requireAdmin smoke).
- [x] `AdminGuard`, `AdminShell` (Sidebar, Topbar, Breadcrumbs); `/admin/login` + 403 page.
- [x] New primitives: `DataTable`, `Pagination`, `Dialog`/`ConfirmDialog`, `Toast`+provider, `Tabs`, `SearchInput`.
- [x] `middleware.ts` cookie-gates `/admin`. [V] admin-in / non-admin-403 / responsive shell.

### Phase 9 — Products & Categories CRUD + images
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§7/§10):**
> - **Scope:** product + category admin APIs/UI + R2 images only. Out: orders/users, settings,
>   drafts/archive UX, inventory movements, bulk/CSV, SEO/slug/SKU admin, Temu, audit_log.
> - **`AdminProductDTO`:** includes `basePrice` (admin-only) + derived sell `price`. Storefront
>   `ProductDTO` unchanged. Whitelist `assert:no-secrets` for `shared/contracts/admin-*.ts`,
>   `features/admin/**`, `src/app/api/admin/**`.
> - **Status:** creates default **`published`** so storefront verify works; no draft workflow UI in P9
>   (enhancement cols exist but full draft/archive = `10`).
> - **Pricing:** keep flat `computeSellPrice(basePrice)` (site.config margin); effective settings = P11.
> - **Images:** multipart only (no base64); **image/** ≤ **5 MB**; product keys
>   `products/{id}/{uuid}.ext`; category `categories/{slug}/{uuid}.ext`. Serve via
>   `GET /api/media/[...key]`. JSON create may omit images then upload, or keep seed `/images/*.svg` URLs.
> - **Delete:** hard DELETE; category with products → `CONFLICT`; product in `order_items` → `CONFLICT`.
> - **List:** products paginated (`page=1`, `pageSize=20`, `q`, `category`, `inStock`, `featured`, `sort`);
>   categories = full array (include `sortOrder` in admin DTO).
> - **UI:** `/admin/products`, `/admin/categories`; un-`soon` nav; reuse P8 DataTable/Dialog/Toast/
>   SearchInput/Pagination; `ImageUploader` + confirm delete.
>
> **Reviewed 2026-07-12 — complete.** Admin catalog APIs + R2 media route + products/categories UI.
> Creates default `published`. `typecheck`/`lint`/`assert:no-secrets` green. ⏳ live create→storefront
> + R2 image smoke on your machine (`preview` / deploy).
- [x] Product admin API (CRUD + image add/remove) + `AdminProductDTO`.
- [x] Category admin API + image + `AdminCategoryDTO`.
- [x] `ProductForm`, `CategoryForm`, `ImageUploader`, list pages (search/filter/paginate + confirm delete).
- [ ] ⏳ [V] create→storefront; delete blocked when referenced; images in R2 via `/api/media`.

### Phase 10 — Orders & Users
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§6/§10 + live schema):**
> - **Scope:** admin orders list/filter/detail + status transitions; users list/view/edit/delete with
>   guards. Out: Bosta shipment create/track (`09`/P14), Paymob admin UI beyond existing
>   `orders.payment_status` (`09`/P13), `order_status_history` timeline (`10-enhancements`),
>   `audit_log` (P12), create/delete orders, password reset, email change, Customer 360, RBAC
>   beyond `customer|admin`.
> - **No new migration** — `orders.status` + `cancelled`, `users.role`, and FK `onDelete` rules
>   already exist (orders/reviews/bridal → `set null`; favorites/addresses/sessions/wallet → `cascade`).
> - **`AdminOrderDTO`:** storefront `OrderDTO` + `userId: string | null` (admin link only). Never
>   invent Paymob/Bosta fields; `tracking` stays optional empty until P14.
> - **`AdminUserDTO`:** `{ id, email, name, phone?, role, createdAt, ordersCount }`. Detail adds
>   `recentOrders: AdminOrderDTO[]` (cap 10). **Never** serialize `passwordHash`.
> - **Status transitions (server-authoritative):** forward **one step only** along
>   `placed → confirmed → sourced → shipped → out_for_delivery → delivered`. `cancelled` allowed
>   from any status **except** `delivered` / already `cancelled`. Same status → no-op OK. Illegal
>   jump / terminal → `VALIDATION`. `OrderStatusSelect` only offers allowed next values.
> - **Orders API:** `GET /api/admin/orders` (`q` = id/phone/name, `status`, `governorate`,
>   `dateFrom`/`dateTo` ISO dates, `page=1`, `pageSize=20`); `GET /[id]`; `PATCH /[id]/status`
>   `{ status }`. No POST/DELETE orders.
> - **Users API:** `GET /api/admin/users` (`q` = email/name/phone, `role`, page/pageSize);
>   `GET /[id]`; `PUT /[id]` `{ name?, phone?, role? }` (email immutable; Egyptian phone when set);
>   `DELETE /[id]` hard delete.
> - **Guards:** cannot delete or demote **self**; cannot delete or demote the **last** admin →
>   `CONFLICT` with clear message.
> - **UI:** `/admin/orders`, `/admin/orders/[id]`, `/admin/users`, `/admin/users/[id]`; reuse P8/P9
>   DataTable/SearchInput/Pagination/ConfirmDialog/Toast; `OrderStatusSelect` + `UserForm`;
>   un-`soon` Orders & Users nav.
> **Reviewed 2026-07-12 — complete.** Admin orders/users APIs + list/detail UI; one-step status +
> cancel; self/last-admin guards. `typecheck`/`lint` green. ⏳ live status/guard smoke on your machine.
- [x] Orders admin API (list/filter/detail/status) + `AdminOrderDTO`.
- [x] Users admin API (list/view/edit/delete + guards) + `AdminUserDTO`.
- [x] Order/user pages (`OrderStatusSelect`, `UserForm`, confirm delete).
- [ ] ⏳ [V] illegal status rejected; self/last-admin guards; edits persist.

### Phase 11 — Locations, Promos, Bridal, Settings
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§4/§6/§10 + live schema/seed):**
> - **Scope:** governorates CRUD + shipping-zone **fee** edit; promo CRUD (+ active toggle); bridal
>   list/detail + mark answered; settings form. Wire **effective settings** into pricing (shipping
>   already reads DB). Out: `audit_log` (P12), logo/favicon/social/SEO/maintenance (`10` §18),
>   landed-cost / FX pricing (`11`), Bosta mapping, promo `max_redemptions`, bridal delete/reply text.
> - **No new migration** — `governorates`, `shipping_zones`, `promos`, `bridal_requests`, `settings`
>   already seeded (`profit_margin`, `free_shipping_threshold`, `site_name`, `site_tagline`, `site_url`).
> - **Effective config:** DB value if present, else `site.config.ts` fallback.
>   - `computeSellPrice(db, basePrice)` reads `profit_margin` (async). Pure math stays
>     `getSellPrice(basePrice, margin?)` in `shared/utils/price.ts`.
>   - Shipping already uses `shipping_zones.fee` + `free_shipping_threshold` — keep that.
> - **Public storefront config (for checkout/cart preview):** `GET /api/storefront-config` →
>   `{ freeShippingThreshold, shippingZones: { zone, label, fee }[] }`. **Never** expose
>   `profit_margin`. Checkout client shipping preview must use this (not static `SHIPPING_RATES`).
> - **Locations API:** `GET/POST /api/admin/governorates`; `PUT/DELETE /[id]` — zone ∈
>   `cairo_giza|near|far`; DELETE → `CONFLICT` if orders/addresses reference. `GET /api/admin/shipping-zones`;
>   `PUT /[zone]` `{ fee }` (fee ≥ 0 int). Zones are fixed (no create/delete zone).
> - **Promos API:** `GET/POST /api/admin/promos`; `PUT /[code]` (code immutable); `DELETE /[code]`;
>   `PATCH /[code]` `{ active }`. Percentage `value` ∈ (0, 1]; fixed `value` > 0. Codes stored uppercased.
> - **Bridal API:** `GET /api/admin/bridal-requests` (`status`, `page`, `pageSize=20`); `GET /[id]`;
>   `PATCH /[id]` `{ status: pending|answered }`. `AdminBridalRequestDTO` includes `mediaUrl` via
>   `/api/media/{fileKey}` when present.
> - **Settings API:** `GET/PUT /api/admin/settings` — partial update of known keys only.
>   `profit_margin` clamped **0.20–0.30**; `free_shipping_threshold` ≥ 0 int; site strings trimmed.
> - **UI:** `/admin/locations` (Tabs: governorates + zones), `/admin/promos`, `/admin/bridal`,
>   `/admin/bridal/[id]`, `/admin/settings`; un-`soon` those nav items; reuse P8 Tabs/DataTable/Toast/
>   ConfirmDialog; `SettingsForm`, `ShippingZoneForm` / inline fee edit, `PromoForm`.
> **Reviewed 2026-07-12 — complete.** Locations/promos/bridal/settings admin + effective
> `profit_margin` in `computeSellPrice`; public `GET /api/storefront-config`; checkout preview wired.
> `typecheck`/`lint`/`assert:no-secrets` green. ⏳ live zone-fee + margin smoke on your machine.
- [x] Locations APIs + pages; shipping/pricing read effective settings; public storefront-config.
- [x] Promos CRUD + Bridal review APIs/pages.
- [x] Settings API + form (margin clamp).
- [ ] ⏳ [V] zone fee → checkout shipping; margin → storefront prices.

### Phase 12 — Dashboard stats + hardening
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§5/§9/§10 + `02` §2.16 + `07` admin):**
> - **Scope:** `GET /api/admin/stats` + live `/admin` dashboard (StatCards, sales chart, recent
>   orders, latest products); `audit_log` table + write on admin mutations; rate-limit admin APIs.
>   Out: audit **viewer** / activity feed / notifications bell (`10` §16/§20 — P18+), chart libraries
>   (CSS/SVG bars only), Paymob/Bosta, inventory/timeline enhancements.
> - **Migration required:** add `audit_log` (`id`, `actor_id` FK→users, `action`, `entity`,
>   `entity_id`, `meta` JSON null, `created_at`). Generate via drizzle; run local + remote migrate.
> - **`AdminStatsDTO`:**
>   `{ revenueTotal, ordersCount, productsCount, usersCount, ordersByStatus,
>     recentOrders: AdminOrderDTO[5], latestProducts: AdminProductDTO[5],
>     salesByDay: { date: YYYY-MM-DD, total }[14] }`.
>   - `revenueTotal` / `salesByDay`: sum `orders.total` where `status ≠ cancelled`.
>   - `ordersByStatus`: all `OrderStatus` keys present (0 if none).
>   - `salesByDay`: last 14 UTC calendar days, missing days → `total: 0`.
>   - Products count = all rows (any status); users = all rows.
> - **Audit writes:** helper `writeAuditLog({ actorId, action, entity, entityId, meta? })` after
>   successful admin creates/updates/deletes/status changes. Actions:
>   `create|update|delete|status_change`. Entities include `product|category|order|user|promo|
>   governorate|shipping_zone|settings|bridal_request`. Best-effort (log + continue if insert fails —
>   never fail the user-facing mutation). **No** audit list UI in P12.
> - **Rate-limit:** extend `rateLimitByIp` with route `'admin'` — **60 req / 60s / IP** on all
>   `/api/admin/**` (call at start of `requireAdmin` or each admin route). Auth login already limited
>   (P7).
> - **UI:** replace placeholder `/admin` with client dashboard; `StatCard`, `SalesChart` (CSS bars),
>   `RecentOrders`, `LatestProducts` in `features/admin/components/`. Links into existing modules.
>   No new nav item (Dashboard already active).
> - **Deploy:** ⏳ `pnpm run deploy` + remote migrate for `audit_log` is a verify step on your machine
>   (agent implements code + local migrate scripts; does not force production deploy).
> **Reviewed 2026-07-12 — complete.** `audit_log` migration (`0001_…`); stats API + live `/admin`
> dashboard; audit writes on mutations; admin rate-limit 60/min. `typecheck`/`lint`/`assert:no-secrets`
> green. ⏳ remote migrate + deploy smoke on your machine.
- [x] `audit_log` schema + migration; `writeAuditLog` wired to admin mutations.
- [x] `GET /api/admin/stats` + dashboard UI (cards, chart, recent/latest).
- [x] Admin API rate-limit (60/min/IP).
- [ ] ⏳ [V] stats match DB; migrate audit_log remote; deploy smoke.

### Phase 16 — Catalog depth
> **Revision notes (locked, vs `10` §4/§5/§15 + `05` P16 + live schema):**
> - **Scope:** admin status workflow, SEO columns, soft archive/restore, storefront hidden-by-link.
>   Out: rich-text editor (column `description_format` only, always `plain`), inventory (P17),
>   duplication/bulk/CSV (P19), slug-based URLs (keep `/product/[id]`).
> - **Already present:** `status`, `slug`, `sku`, `stock_qty`, `reserved_qty`.
> - **Migration:** add `seo_title`, `seo_description`, `og_image`, `canonical_url`,
>   `description_format` (`plain`|`html`, default `plain`), `archived_at`.
> - **Status:** create default **`draft`** (form); lists/search = `published` only; **detail** allows
>   `published`|`hidden`; checkout still requires `published`. Admin list `?status=` (default
>   excludes `archived` unless filtered / `status=all`).
> - **Delete:** `DELETE` → archive (`status=archived`, `archived_at=now`). Second DELETE on archived
>   with no `order_items` → hard delete + R2 cleanup; with refs → `CONFLICT`.
>   `POST /api/admin/products/[id]/restore` → `draft`, clear `archived_at`.
> - **SEO:** `generateMetadata` prefers stored SEO fields; else name/description/image/id canonical.
> **Reviewed 2026-07-12 — complete.** Migration `0002_even_ikaris` (SEO + `description_format` +
> `archived_at`); admin status/SEO/archive/restore; storefront lists = published, detail =
> published|hidden; metadata SEO fallbacks. `typecheck`/`lint`/`assert:no-secrets`/`build` green.
> ⏳ remote migrate + smoke (draft/hidden/archive) on your machine.
- [x] Migration + contracts (`status`/SEO on admin write + DTO).
- [x] Admin archive/restore/status APIs; storefront hidden detail + metadata.
- [x] ProductForm + list filter + archive/restore UI.
- [ ] ⏳ [V] draft hidden from shop; hidden direct-link OK; archive/restore works.

### Phase 17 — Inventory ⭐
> **Revision notes (locked, vs `10` §1 + `05` P17 + live schema):**
> - **Already present:** `stock_qty`, `reserved_qty`, `in_stock` on products.
> - **Migration:** `inventory_movements` (`id`, `product_id`, `old_qty`, `new_qty`, `delta`,
>   `reason` ∈ restock|sale|adjustment|return|reservation|release, `order_id?`, `actor_id?`,
>   `note?`, `created_at`). Settings key `low_stock_threshold` (default 5).
> - **Available:** `stock_qty - reserved_qty`. Storefront `inStock` = admin flag AND available > 0.
>   Checkout rejects when available < line qty; increments `reserved_qty` + `reservation` movement.
> - **Lifecycle:** cancel → `release` (decrement reserved); **delivered** → `sale` (decrement stock +
>   reserved). Cron unpaid expiry deferred to P22; Paymob payment path deferred to P13.
> - **Admin:** `POST /api/admin/products/[id]/stock` `{ delta, reason, note? }`;
>   `GET .../inventory` history; settings `lowStockThreshold`; dashboard `lowStockProducts[]`.
> - **UI:** stock adjust + history on product edit; threshold on Settings; low-stock on dashboard.
>   Storefront: existing Sold Out badge / disabled add-to-bag via derived `inStock`.
> - **Out:** notifications bell (P18), cron release (P22), Temu sync (P24), separate Inventory nav.
> **Reviewed 2026-07-12 — complete.** Migration `0003_funny_rocket_racer` (`inventory_movements`);
> reserve on place / release on cancel / sale on delivered; admin stock adjust + history; settings
> `low_stock_threshold`; dashboard low-stock list; storefront derived `inStock`.
> `typecheck`/`lint`/`assert:no-secrets`/`build` green. ⏳ remote migrate + smoke on your machine.
- [x] Migration + inventory contracts/service.
- [x] Reserve/release/sale wired to orders; admin stock APIs; settings + stats.
- [x] Product edit stock UI; settings; dashboard low-stock.
- [ ] ⏳ [V] oversell blocked; cancel releases; deliver sells; adjust logs movement.

## Phases 16–23 — Production enhancements
The remaining enhancement task list (order timeline ⭐, bulk ⭐, duplication ⭐, audit
viewer ⭐, CSV, media library, notifications, customer 360, coupon usage, analytics, RBAC,
cron, homepage builder) lives in **`10-enhancements.md`**. P16 catalog depth and P17 inventory are above.

## Phases 24–26 — Sourcing, pricing & merchandising
The full, granular task list (landed-cost pricing engine, Temu importer, stock sync, bundles,
pre-orders, shipping timelines, social proof) lives in **`11-sourcing-pricing-merchandising.md`** Part 8.
Key adds: product source/pricing columns + `bundles`/`bundle_items`/`fx_rates` (`02` §2.25–2.28),
`SCRAPER_API_KEY`/`FX_API_KEY` (`01`), `temu-stock-sync` + `fx-rate-refresh` cron (`server/jobs/`),
`computeSellPrice` as the single price authority, and flags `dynamic_pricing/bundles/preorders/
social_proof`. Automation is catalog+inventory only — never auto-purchasing at checkout.

## Phases 13–15 — Payments (Paymob) & Shipping (Bosta)
The full, granular integration task list lives in **`09-integrations-bosta-paymob.md` Part E**. Key
adds: `payments`/`shipments` tables (`02`), `PAYMOB_*`/`BOSTA_*` secrets (`01`), HMAC-SHA512 Paymob
webhook + Bosta status-mapping webhook (both idempotent), checkout method selector + confirmation polling,
governorate→Bosta location mapping, and admin shipment create/track. Webhooks are the source of truth —
never mark paid/shipped from the browser.

---

## Cross-cutting "definition of done" (every task)
- No `any`; TypeScript strict passes.
- New code imported only via feature/`server` boundaries (no deep cross-feature imports).
- Handler stays thin (validate → service → envelope); logic in service/repo.
- Matching contract schema reused on client + server.
- `pnpm build && pnpm typecheck && pnpm lint` clean before checking the box.
