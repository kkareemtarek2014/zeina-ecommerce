# Zaya API

Live **storefront + admin catalog** HTTP contract for the Cloudflare Worker (`zaya-ecommerce`).
Further admin modules: [`docs/backend/08-admin-dashboard.md`](docs/backend/08-admin-dashboard.md).
Full design notes: [`docs/backend/03-api-contracts.md`](docs/backend/03-api-contracts.md).

**Base URL:** https://zaya-ecommerce.mitchdesigns.workers.dev (or `http://127.0.0.1:8787` via `pnpm preview`).  
**Site URL (SEO / canonicals):** placeholder `https://Zaya-eg.com` in `SITE.url` — update when the real domain is purchased.

---

## Envelope

Every route returns:

```ts
{ ok: true, data: T } | { ok: false, error: { code, message, details? } }
```

| Code | HTTP |
| --- | --- |
| `VALIDATION` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `PAYLOAD_TOO_LARGE` | 413 |
| `RATE_LIMITED` | 429 |
| `INTERNAL` | 500 |

Writes are validated with Zod schemas from `src/shared/contracts/` (and feature schemas where reused). Handlers use `withHandler` → envelope mapping.

**Secrets never serialized on storefront:** `basePrice` and `password_hash` / `passwordHash` stay
server-only (`toProductDTO` / `toUserDTO`). Admin catalog DTOs **do** include `basePrice` (whitelist in
`assert:no-secrets`). Run `pnpm assert:no-secrets`.

---

## Auth

Cookie: `zaya_session` (httpOnly, Secure, SameSite=Lax). Passwords: PBKDF2 + pepper.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Rate-limited · auto-login |
| POST | `/api/auth/login` | — | Rate-limited · generic error |
| POST | `/api/auth/logout` | soft | Clears cookie |
| GET | `/api/auth/me` | session | `UserDTO` (no password fields) |
| POST | `/api/auth/forgot-password` | — | Rate-limited · always `{ ok: true }` |

Rate limit (P7): ~20 req / 60s / IP on login, register, forgot (in-memory per isolate).

---

## Catalog

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/products` | — | `?category&featured&sort&q` |
| GET | `/api/products/[id]` | — |
| GET | `/api/products/[id]/related` | — |
| GET | `/api/products/new` | — |
| GET | `/api/products/search` | — |
| GET | `/api/categories` | — |
| GET | `/api/governorates` | — |

`ProductDTO` includes sell `price` only — never `basePrice`.

---

## Promo & orders

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/promos/validate` | — |
| POST | `/api/orders` | guest OK (attaches `user_id` if session) |
| GET | `/api/orders` | required |
| GET | `/api/orders/[id]` | public by unguessable id |

Order totals are **server-computed** (prices, shipping zones, free ≥1500 on pre-discount subtotal, promo).

---

## Account

All require session.

| Method | Path |
| --- | --- |
| GET/PUT | `/api/account/profile` |
| GET/POST | `/api/account/addresses` |
| DELETE | `/api/account/addresses/[id]` |
| GET/PUT | `/api/account/favorites` |
| GET | `/api/account/wallet` |

Wallet returns **404** while feature flag `wallet` is OFF (same as `/account/wallet` page).

---

## Bridal & reviews

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/bridal-requests` | guest OK | `multipart/form-data`; file ≤25MB image/video → R2; rate-limited |
| GET | `/api/reviews?productId=` | — | summary + items |
| POST | `/api/reviews` | required | No storefront UI yet; recomputes product rating |

---

## Media

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/media/[...key]` | — | Serves R2 object (`products/…`, `categories/…`, bridal uploads) |

---

## Storefront config

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/storefront-config` | — | `{ freeShippingThreshold, shippingZones }` — checkout/cart preview. No `profit_margin`. |

Sell prices use effective `profit_margin` from `settings` (server-only). Shipping totals on orders use DB zone fees + threshold.

---

## Admin (Phase 8–11)

All `/api/admin/**` require session + `role=admin` (`requireAdmin`).

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/health` | Smoke |
| GET | `/api/admin/products` | Paginated `?page&pageSize&q&category&inStock&featured&sort` |
| POST | `/api/admin/products` | Create · default `status=published` · `AdminProductDTO` (+ `basePrice`) |
| GET/PUT/DELETE | `/api/admin/products/[id]` | DELETE → `CONFLICT` if in `order_items` |
| POST | `/api/admin/products/[id]/images` | `multipart` · `file` · image/* ≤5MB |
| DELETE | `/api/admin/products/[id]/images` | JSON `{ url }` |
| GET/POST | `/api/admin/categories` | Full list (incl. `sortOrder`) |
| PUT/DELETE | `/api/admin/categories/[slug]` | DELETE → `CONFLICT` if products remain |
| POST | `/api/admin/categories/[slug]/image` | `multipart` · single `file` |
| GET | `/api/admin/orders` | Paginated `?q&status&governorate&dateFrom&dateTo&page&pageSize` · `AdminOrderDTO` (+ `userId`) |
| GET | `/api/admin/orders/[id]` | Detail with items |
| PATCH | `/api/admin/orders/[id]/status` | One-step forward or `cancelled` (not from delivered) |
| GET | `/api/admin/users` | Paginated `?q&role&page&pageSize` · `AdminUserDTO` |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Email immutable; self/last-admin guards on demote/delete |
| GET/POST | `/api/admin/governorates` | CRUD · DELETE → `CONFLICT` if orders/addresses reference |
| PUT/DELETE | `/api/admin/governorates/[id]` | |
| GET | `/api/admin/shipping-zones` | Fixed zones |
| PUT | `/api/admin/shipping-zones/[zone]` | `{ fee }` ≥ 0 |
| GET/POST | `/api/admin/promos` | |
| PUT/PATCH/DELETE | `/api/admin/promos/[code]` | PATCH `{ active }`; code immutable on PUT |
| GET | `/api/admin/bridal-requests` | Paginated `?status&page&pageSize` |
| GET/PATCH | `/api/admin/bridal-requests/[id]` | PATCH `{ status }` |
| GET | `/api/admin/settings` | Margin 0.20–0.30; threshold ≥ 0 |
| PUT | `/api/admin/settings` | Partial update |
| GET | `/api/admin/stats` | Dashboard: revenue, counts, ordersByStatus, recentOrders, latestProducts, salesByDay (14d) |

All `/api/admin/**` are rate-limited (~60 req/min/IP). Admin mutations write `audit_log` (viewer = later enhancement).

UI: `/admin/**` through settings + live dashboard stats (noindex).

---

## Client usage

```ts
import { api } from '@/shared/lib/api-client';
// credentials: 'include' — session cookie
const products = await api.get<ProductDTO[]>('/api/products');
```

Feature services under `src/features/*/services/` call `api` / `api.postForm` only.

---

## Ops (Phase 7)

```bash
pnpm db:migrate:remote
# after P12: applies audit_log migration too
# set secrets (once): SESSION_SECRET, PASSWORD_PEPPER
pnpm db:seed:remote   # export local seeded data → remote D1 (no wipe)
pnpm run deploy       # note: use `pnpm run deploy` (not bare `pnpm deploy`)
pnpm assert:no-secrets
```

Seeded logins (change before public go-live): `test@example.com` / `password123`, `admin@zaya-eg.com` / `password123`.
