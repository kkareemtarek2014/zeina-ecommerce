# 02 — Data Model (D1 + Drizzle)

Every table below is justified by an existing frontend feature (see `00-analysis.md`). No speculative
tables. IDs keep the frontend's existing string-id conventions (`p-001`, `ZN-…`, `BR-…`, `user_…`,
`addr-…`) so seed data and any persisted client references stay valid.

---

## 1. Entity-relationship overview

```
categories ──1:N── products ──1:N── reviews
                       │
                       └────< order_items >──── orders ──N:1── users
                                                   │             │
                                                   │             ├──1:N── addresses
governorates ──ref── orders.governorate_id        │             ├──1:N── favorites ──N:1── products
governorates ──ref── addresses.governorate_id      │             ├──1:N── wallet_transactions
                                                   │             └──1:N── sessions
promos ──(validated at)── orders.promo_code
orders ──1:1── payments (Paymob)   ·   orders ──1:1── shipments (Bosta)
bridal_requests (standalone; optional user link)

integrations: payments (Paymob) · shipments (Bosta) · governorates.bosta_city_id (see 09)
admin tables:  users.role gates admin · shipping_zones (delivery fees) · settings (runtime config)
               · audit_log ──N:1── users   (see 08-admin-dashboard.md)
```

Conventions: `snake_case` columns, `text` PKs (match existing string ids), `integer` timestamps
(Unix epoch ms) via Drizzle `{ mode: 'timestamp_ms' }`, booleans as `integer {mode:'boolean'}`, money
stored as **integer EGP** (no fractions — prices round to 5 EGP), enums as `text` with a CHECK.

---

## 2. Tables

### 2.1 `categories` — *why:* powers category pills, `/shop/[category]`, SEO meta
| Column | Type | Notes |
| --- | --- | --- |
| `slug` | text PK | e.g. `jewelry` |
| `name` | text | display name |
| `image` | text | `/images/cat-*.svg` |
| `seo_description` | text | used in category `<meta>` |
| `sort_order` | integer | keep stable pill order |

### 2.2 `products` — *why:* whole catalog (home/shop/product/search/related)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `p-001` |
| `name` | text | |
| `category_slug` | text FK→categories.slug | |
| `base_price` | integer | **sourcing cost, server-only, never in API** |
| `compare_at_price` | integer null | "was" price for sale styling |
| `description` | text | |
| `images` | text (JSON array) | `["/images/p-001.svg", ...]` |
| `rating` | real | denormalized avg (kept in sync from reviews, seeded from data) |
| `review_count` | integer | denormalized count |
| `in_stock` | integer(bool) | admin override; effective stock = `stock_qty - reserved_qty > 0` (see `10` §1) |
| `featured` | integer(bool) | drives home featured row |
| `tags` | text (JSON array) null | `["best seller"]`; used by search |
| `created_at` | integer(ts) | drives "new arrivals" ordering (seed preserves array order) |

**Enhancement columns (see `10`):**

| Column | Type | Notes |
| --- | --- | --- |
| `slug` | text UNIQUE null | SEO slug; `/product/[slug]` (keep `[id]` working) — `10` §5 |
| `sku` | text UNIQUE null | stock-keeping unit; admin search + CSV upsert key — `10` §9 |
| `status` | text | `draft` \| `published` \| `hidden` \| `archived` (CHECK), default `draft` — `10` §4/§15 |
| `stock_qty` | integer | on-hand quantity — `10` §1 |
| `reserved_qty` | integer | reserved during checkout, released by cron — `10` §1/§21 |
| `seo_title` / `seo_description` | text null | per-product SEO overrides — `10` §5 |
| `og_image` / `canonical_url` | text null | SEO overrides — `10` §5 |
| `description_format` | text | `plain` \| `html` (rich text), default `plain` — `10` §12 |
| `archived_at` | integer(ts) null | set when `status='archived'` (soft delete) — `10` §15 |

> `price` (sell price) is **computed**, not stored: `getSellPrice(base_price)`. The product DTO exposes
> `price` + `compareAtPrice`, never `base_price`.
> **Storefront reads only `status='published'`** (product service filter — `03` §3). Seeded products
> are seeded as `published` with `stock_qty` set (e.g. a default) so the current catalog is unchanged.

### 2.3 `governorates` — *why:* checkout select + shipping zone
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `cairo` |
| `name` | text | `Cairo` |
| `zone` | text | `cairo_giza` \| `near` \| `far` (CHECK) |

Read-only reference. Could stay a static import; kept as a table so checkout validates against DB and
shipping is authoritative server-side. Seed from `governorates.data.ts` (27 rows).

### 2.4 `promos` — *why:* coupon apply in cart/checkout
| Column | Type | Notes |
| --- | --- | --- |
| `code` | text PK (upper) | `WELCOME10` |
| `type` | text | `percentage` \| `fixed` (CHECK) |
| `value` | real | percentage as decimal (0.1) or fixed EGP (50) |
| `min_order_value` | integer null | threshold |
| `active` | integer(bool) | allows disabling without deleting |

### 2.5 `users` — *why:* auth (login/register), account
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `user_…` |
| `email` | text UNIQUE (lower) | |
| `name` | text | |
| `phone` | text null | |
| `password_hash` | text | PBKDF2 output `salt:hash` (base64) — **never returned** |
| `role` | text | RBAC role — `customer` \| `admin` \| `manager` \| `order_manager` \| `product_manager` \| `content_manager` (CHECK), default `customer`. Permissions per role via a code-defined `ROLE_PERMISSIONS` map (or optional `role_permissions` table) — see `08` + `10` §19 |
| `created_at` | integer(ts) | |

Public `UserDTO` = `{ id, email, name, phone, role }`. `password_hash` never leaves the server. The
admin dashboard (`08-admin-dashboard.md`) reuses this single table, scoped by `role` — no separate
admin table.

### 2.6 `sessions` — *why:* session-token auth (D1 + httpOnly cookie)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | opaque random token (stored hashed) |
| `user_id` | text FK→users.id (cascade delete) | |
| `expires_at` | integer(ts) | e.g. +30 days |
| `created_at` | integer(ts) | |

Cookie holds the raw token; DB stores its SHA-256 so a DB leak can't mint sessions. Lookup by hash.

### 2.7 `orders` — *why:* checkout place-order, `/order/[id]`, account orders
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `ZN-…` (generator preserved) |
| `user_id` | text FK→users.id null | null for guest COD checkout |
| `status` | text | `placed\|confirmed\|sourced\|shipped\|out_for_delivery\|delivered\|cancelled` (CHECK) |
| `full_name` | text | shipping address snapshot |
| `phone` | text | |
| `governorate_id` | text FK→governorates.id | |
| `city` | text | |
| `street` | text | |
| `address_notes` | text null | |
| `payment_method` | text | `cod` \| `card` \| `wallet` (CHECK) — `card`/`wallet` via Paymob (see `09`) |
| `payment_status` | text | `pending` \| `paid` \| `failed` \| `refunded` (CHECK), default `pending` (COD = `pending` until delivered) |
| `subtotal` | integer | Σ item lines, server-computed |
| `discount` | integer | from promo (0 if none) |
| `shipping` | integer | server-computed |
| `total` | integer | subtotal − discount + shipping |
| `promo_code` | text null | applied code |
| `note` | text null | order note (order_note feature) |
| `created_at` | integer(ts) | |

Address is **snapshotted** onto the order (not FK to `addresses`) so history is stable — matches the
current `Order.address` shape.

### 2.8 `order_items` — *why:* order line items
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | generated |
| `order_id` | text FK→orders.id (cascade) | |
| `product_id` | text FK→products.id | |
| `name` | text | snapshot |
| `image` | text | snapshot |
| `unit_price` | integer | **server-recomputed** sell price at order time |
| `quantity` | integer | 1–10 (matches cart cap) |

### 2.9 `addresses` — *why:* account address book
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `addr-…` |
| `user_id` | text FK→users.id (cascade) | |
| `label` | text | e.g. "Home" |
| `governorate_id` | text FK→governorates.id | |
| `city` | text | |
| `street` | text | |

### 2.10 `favorites` — *why:* wishlist (shop cards, product, account)
| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | text FK→users.id (cascade) | composite PK part |
| `product_id` | text FK→products.id (cascade) | composite PK part |
| `created_at` | integer(ts) | |

PK = (`user_id`,`product_id`). Guests keep favorites in localStorage; on login the client can PUT the
full set to sync (see `03`).

### 2.11 `reviews` — *why:* product reviews (currently hardcoded in component)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `product_id` | text FK→products.id (cascade) | |
| `user_id` | text FK→users.id null | null for seed/imported reviews |
| `author_name` | text | display ("Sarah M.") |
| `rating` | integer | 1–5 (CHECK) |
| `comment` | text | |
| `helpful` | integer | default 0 |
| `created_at` | integer(ts) | drives "2 months ago" relative label |

`products.rating`/`review_count` are recomputed when a review is inserted (or read live via AVG — pick
one; denormalized is simplest and matches seed). Seed from the static array in `ProductReviews.tsx`.

### 2.12 `wallet_transactions` — *why:* account wallet (flag-gated, seeded)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `txn_…` |
| `user_id` | text FK→users.id (cascade) | |
| `type` | text | `credit` \| `debit` (CHECK) |
| `amount` | integer | EGP |
| `description` | text | |
| `created_at` | integer(ts) | |

Balance = Σ(credit) − Σ(debit), computed in the wallet service (no stored balance column → no drift).

### 2.13 `bridal_requests` — *why:* bridal custom form (+file upload)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `BR-…` |
| `user_id` | text FK→users.id null | optional |
| `full_name` | text | |
| `phone` | text | |
| `wedding_date` | text null | ISO date string (kept as text, matches form) |
| `description` | text | |
| `file_key` | text null | **R2 object key** (real upload now, not just metadata) |
| `file_name` | text null | original name |
| `file_type` | text null | mime |
| `status` | text | `pending` \| `answered` (CHECK) |
| `created_at` | integer(ts) | |

### 2.13a `payments` — *why:* Paymob card/wallet payments (see `09` Part A)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `order_id` | text FK→orders.id (cascade) | |
| `provider` | text | `paymob` |
| `method` | text | `card` \| `wallet` |
| `amount` | integer | EGP (gateway receives ×100 piasters) |
| `currency` | text | `EGP` |
| `paymob_intention_id` | text null | from Intention API |
| `paymob_transaction_id` | text UNIQUE null | from webhook — **idempotency key** |
| `status` | text | `pending` \| `paid` \| `failed` \| `refunded` (CHECK) |
| `raw` | text (JSON) null | last webhook/intention payload for audit |
| `created_at` | integer(ts) | |

### 2.13b `shipments` — *why:* Bosta delivery + tracking (see `09` Part B)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `order_id` | text FK→orders.id (cascade) | |
| `provider` | text | `bosta` |
| `bosta_delivery_id` | text null | Bosta `_id` |
| `tracking_number` | text UNIQUE null | shown to customer + admin |
| `bosta_state` | text null | raw Bosta state (audit) |
| `mapped_status` | text | our `OrderStatus` after mapping |
| `cod_amount` | integer | COD to collect (0 if prepaid via Paymob) |
| `raw` | text (JSON) null | last webhook payload |
| `created_at` / `updated_at` | integer(ts) | |

> `governorates` gains `bosta_city_id` (+ optional zone/district) for location mapping (`09` §B.4).
> Optional `webhook_events` table (id, provider, event_id UNIQUE, received_at) for strict idempotency.

### 2.14 `shipping_zones` — *why:* admin-editable delivery fees (formerly `SHIPPING_RATES` constant)
| Column | Type | Notes |
| --- | --- | --- |
| `zone` | text PK | `cairo_giza` \| `near` \| `far` |
| `label` | text | display name in admin |
| `fee` | integer | delivery fee in EGP |

Governorate→zone mapping stays on `governorates`. Seed from `SHIPPING_RATES` (50/80/100). The shipping
service reads this table (falls back to `site.config.ts` if empty). *(Admin dashboard — `08`.)*

### 2.15 `settings` — *why:* admin settings page (runtime-editable config)
| Column | Type | Notes |
| --- | --- | --- |
| `key` | text PK | e.g. `profit_margin`, `free_shipping_threshold`, `site_name`, `site_tagline` |
| `value` | text (JSON) | typed per key |
| `updated_at` | integer(ts) | |

Key-value store so config edits don't need a deploy. **Effective config** = DB value if present, else
the `site.config.ts` constant (kept as fallback so nothing breaks before seeding). Pricing
(`getSellPrice`) and shipping read effective settings. `profit_margin` validated to 0.20–0.30.
*(Admin dashboard — `08`.)*

### 2.16 `audit_log` — *why:* admin action logging ("logging where useful"; optional but recommended)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `actor_id` | text FK→users.id | admin who acted |
| `action` | text | `create` \| `update` \| `delete` \| `status_change` |
| `entity` | text | `product` \| `category` \| `order` \| `user` \| `promo` \| `governorate` \| `settings` \| ... |
| `entity_id` | text | affected row id |
| `meta` | text (JSON) null | before/after summary |
| `created_at` | integer(ts) | |

Written on admin mutations. Not read by the storefront. Powers the audit-log viewer (`10` §16) and the
activity feed (`10` §20).

---

## 2b. Enhancement tables (see `10`)

### 2.17 `inventory_movements` — *why:* stock history + adjustments (`10` §1) ⭐
`id PK · product_id FK→products (cascade) · old_qty · new_qty · delta · reason (restock|sale|adjustment|
return|reservation|release, CHECK) · order_id FK→orders null · actor_id FK→users null · note null ·
created_at`. One row per stock change; drives the low-stock dashboard and the "why did stock change" view.

### 2.18 `order_status_history` — *why:* order timeline (`10` §2) ⭐
`id PK · order_id FK→orders (cascade) · from_status null · to_status · actor (admin|system|paymob|bosta) ·
actor_id null · note null · created_at`. One row per transition (checkout, admin, Paymob/Bosta webhooks).
Feeds the existing `OrderStatusTimeline` component + admin timeline.

### 2.19 `notifications` — *why:* dashboard bell (`10` §10)
`id PK · type (new_order|low_stock|payment_failed|bridal_request|...) · title · body · entity · entity_id ·
read (bool, default false) · created_at`. Written by the triggering event; polled by the admin bell.

### 2.20 `media_assets` — *why:* media library / image reuse (`10` §11)
`id PK · r2_key · url · filename · mime · size · width null · height null · alt null · folder null ·
uploaded_by FK→users · created_at`. Product/category/logo image pickers select from here.

### 2.21 `promo_redemptions` — *why:* coupon usage stats (`10` §14)
`id PK · promo_code FK→promos.code · order_id FK→orders (cascade) · user_id FK→users null · discount ·
created_at`. Written when an order applies a promo. `promos` gains optional `max_redemptions` for
"remaining". Usage/revenue-per-coupon derived from this table.

### 2.22 `product_views` — *why:* "most viewed" analytics (`10` §3)
`product_id PK FK→products (cascade) · views (int, default 0) · updated_at`. Incremented on product-page
view. (Conversion rate needs visit analytics — deferred.)

### 2.23 `homepage_blocks` — *why:* homepage builder (`10` §17, **future/flagged**)
`id PK · type (hero|featured|new_arrivals|collection|promo, CHECK) · position · config (JSON) · active
(bool) · created_at`. Home renders active blocks in `position` order. Behind a feature flag.

### 2.24 `role_permissions` — *why:* dynamic RBAC (`10` §19, optional)
`role · permission` (composite PK). Optional — ship the code-defined `ROLE_PERMISSIONS` map first; add
this table only if permissions must be editable at runtime.

> Optional `webhook_events` (idempotency, `09` §C.1) and a settings-driven cron config round these out.

---

## 3. Relationships summary

- `products.category_slug` → `categories.slug` (RESTRICT).
- `order_items.order_id` → `orders.id` (CASCADE); `order_items.product_id` → `products.id` (RESTRICT).
- `orders.user_id` → `users.id` (SET NULL); `orders.governorate_id` → `governorates.id` (RESTRICT).
- `addresses / favorites / reviews / wallet_transactions / sessions .user_id` → `users.id` (CASCADE).
- `favorites.product_id`, `reviews.product_id` → `products.id` (CASCADE).

---

## 4. Drizzle schema (reference implementation)

One file per table under `src/server/db/schema/`, re-exported from `index.ts`. Representative examples
(implementer fills the rest by the same pattern):

```ts
// src/server/db/schema/products.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categorySlug: text('category_slug').notNull().references(() => categories.slug),
  basePrice: integer('base_price').notNull(),          // server-only
  compareAtPrice: integer('compare_at_price'),
  description: text('description').notNull(),
  images: text('images', { mode: 'json' }).$type<string[]>().notNull(),
  rating: real('rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
```

```ts
// src/server/db/schema/orders.ts (excerpt)
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['placed','confirmed','sourced','shipped','out_for_delivery','delivered','cancelled'],
  }).notNull().default('placed'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  governorateId: text('governorate_id').notNull().references(() => governorates.id),
  city: text('city').notNull(),
  street: text('street').notNull(),
  addressNotes: text('address_notes'),
  paymentMethod: text('payment_method', { enum: ['cod'] }).notNull().default('cod'),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shipping: integer('shipping').notNull(),
  total: integer('total').notNull(),
  promoCode: text('promo_code'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
```

```ts
// src/server/db/schema/favorites.ts (composite PK)
import { primaryKey } from 'drizzle-orm/sqlite-core';
export const favorites = sqliteTable('favorites', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.productId] }) }));
```

`drizzle.config.ts` targets `dialect: 'sqlite'`, `driver: 'd1-http'` (or local file for dev), `schema:
'./src/server/db/schema', out: './src/server/db/migrations'`.

---

## 5. Migrations

- Generate: `pnpm drizzle-kit generate` → SQL files in `src/server/db/migrations/`.
- Apply local: `wrangler d1 migrations apply zaya-db --local`.
- Apply remote: `wrangler d1 migrations apply zaya-db --remote`.
- Never hand-edit applied migrations; add new ones for changes.

---

## 6. Seeding (port `src/shared/data` → D1)

`src/server/db/seed.ts` imports the existing arrays and inserts them so **nothing is retyped** and the
storefront looks identical after migration:

- `CATEGORIES` (7) → `categories` (assign `sort_order` by array index).
- `PRODUCTS` (12) → `products` (`created_at` = base time + index, preserving new-arrivals order which
  currently uses reversed array order). Seed `status='published'`, a `slug` from the name, a generated
  `sku`, and a default `stock_qty` (e.g. 50) + `reserved_qty=0` so the catalog looks unchanged (`10` §1/§4).
- `GOVERNORATES` (27) → `governorates`.
- `PROMOS_DB` (2) → `promos` (`active=true`).
- `SEED_USERS` (1) → `users` — **re-hash** the plaintext `password123` with PBKDF2 during seed; never
  store plaintext; role `customer`. **Also seed one `admin` user** (`admin@zaya-eg.com`, hashed) so the
  dashboard is reachable after setup (see `08` §2).
- `SHIPPING_RATES` (50/80/100) → `shipping_zones`; `PROFIT_MARGIN`, `FREE_SHIPPING_THRESHOLD`, site
  meta → `settings`.
- Sample order `ZN-MOCK-123` (from `orders.store.ts`) → `orders` + `order_items`, so the admin
  dashboard has a sample order to display.
- Static reviews from `ProductReviews.tsx` → `reviews` for a representative product, then recompute
  `products.rating`/`review_count`.
- Wallet seed (balance 350 via +500 / −150) → `wallet_transactions` for the seed user.

Run with `wrangler d1 execute` or a `tsx` script bound to the local D1. Idempotent (`INSERT OR IGNORE`).
