# 10 — Production Enhancements

Operational features that lift Zaya from "working backend + admin" to a real e-commerce platform. These
are **net-new admin/operations capabilities** (not derived from the current storefront), so they're
tracked separately and scheduled **after** the core storefront (`00`–`07`), admin (`08`), and
integrations (`09`). Storefront UI stays unchanged except a few small, data-driven touches noted inline
(e.g. an out-of-stock badge).

Each item lists: **what**, **data-model impact** (canonical detail in `02`), **API/admin surface**
(canonical detail in `08`), and its **phase**. ⭐ = the requested top-5.

---

## 0. Priorities

**Top 5 (build first):** ⭐ Inventory + stock history · ⭐ Order timeline/status history · ⭐ Bulk product
actions · ⭐ Product duplication · ⭐ Audit log (audit log is already specced in `02` §2.16 / `08` — here
it's confirmed and extended to a viewable UI).

**Phase map (continues `05-plan.md`):**
`P16` Catalog depth · `P17` Inventory ⭐ · `P18` Order timeline ⭐ + notifications + activity feed ·
`P19` Bulk ⭐ + duplication ⭐ + CSV + media library + rich text + better search ·
`P20` Customer 360 + coupon usage + dashboard analytics + expanded settings ·
`P21` RBAC roles/permissions · `P22` Automation (Cron Triggers) · `P23` Homepage builder (future).

---

## 1. ⭐ Inventory management  *(P17 — highest priority)*
**What:** real stock quantities, a movement history, manual adjustments, low-stock warnings, out-of-stock
badge, and stock reserved during checkout.
**Data model:** products gain `stock_qty` (integer) and `reserved_qty`; `in_stock` becomes derived
(`stock_qty - reserved_qty > 0`) but is kept as an admin override. New **`inventory_movements`** table:
`id, product_id, old_qty, new_qty, delta, reason(enum: restock|sale|adjustment|return|reservation|release),
order_id?, actor_id?, note?, created_at`. (See `02` §2.2 update + §2.17.)
**Reserved stock at checkout:** on `POST /api/orders`, increment `reserved_qty` for each line
(atomic); on payment success / delivery it converts to a `sale` movement; on cancel/expiry it's released
(see Cron, §22). Prevents overselling between add-to-cart and payment.
**API/admin:** `POST /api/admin/products/[id]/stock` (adjust with reason), `GET .../inventory` (history),
low-stock threshold in settings, low-stock list on the dashboard.
**Storefront (small, data-driven):** out-of-stock badge on `ProductCard`/`ProductDetails` from the
existing `inStock`; disable add-to-bag when `stock_qty - reserved_qty <= 0`.

## 2. ⭐ Order timeline / status history  *(P18)*
**What:** keep every status transition, not just the current one.
**Data model:** **`order_status_history`** table: `id, order_id, from_status?, to_status, actor_id?
(admin|system|paymob|bosta), note?, created_at`. (See `02` §2.18.) Write a row on every status change
(checkout, admin, Paymob webhook, Bosta webhook).
**API/admin:** `GET /api/admin/orders/[id]` returns `timeline[]`; order detail renders a vertical
timeline (Created → Payment Received → Packed → Shipped → Delivered …). The storefront
`OrderStatusTimeline` component already exists — feed it from this table.

## 3. Dashboard analytics  *(P20)*
**What:** richer KPIs beyond counts.
**Data model:** mostly derived from `orders`/`order_items`; "most viewed" needs a lightweight
**`product_views`** counter (`product_id` PK, `views` int) incremented on product-page view (or a
`product_view_events` table if per-day is wanted). Conversion rate needs session/visit analytics —
**deferred** until an analytics source exists (documented, not built now).
**API/admin:** extend `GET /api/admin/stats` with `revenueToday`, `revenueThisMonth`, `avgOrderValue`,
`bestSellers[]` (by qty/revenue), `mostViewed[]`, `topCategories[]`, `newCustomers` (last 30d).

## 4. Product status / drafts  *(P16)*
**What:** replace Active/Deleted with `draft | published | hidden | archived`.
**Data model:** `products.status` enum (default `draft`). (See `02` §2.2 update.)
**Rule:** **storefront reads only `status='published'`** (product service adds the filter — `03` §3
update). `hidden` = reachable by direct link but not listed; `archived` = soft-deleted (see §15).
**Admin:** status control on the product form + filter in the list.

## 5. Product SEO fields  *(P16)*
**What:** editable per-product SEO instead of always auto-generated.
**Data model:** `products.seo_title`, `seo_description`, `og_image`, `canonical_url`, and **`slug`**
(unique). (See `02` §2.2 update.)
**Rule:** `generateMetadata` uses the stored values when present, else falls back to the current
auto-generation. Product routes can move to `/product/[slug]` (keep `[id]` working via redirect) — or
keep `[id]` and use `slug` only for SEO/canonical. Keep it backward-compatible.

## 6. ⭐ Product duplication  *(P19)*
**What:** clone a product, then edit color/price/images.
**API/admin:** `POST /api/admin/products/[id]/duplicate` → creates a `draft` copy (new id/slug/SKU,
`stock_qty=0`, images copied or re-referenced in R2), returns it for editing. No schema change.

## 7. ⭐ Bulk actions  *(P19)*
**What:** operate on many products at once: delete/archive, publish, hide, change category, export.
**API/admin:** `POST /api/admin/products/bulk` `{ ids[], action, payload? }` (action ∈
`archive|publish|hide|set-category|export`). Validates each id; returns a per-id result summary. Table
gets row checkboxes + a bulk toolbar + confirm dialog.

## 8. CSV import / export  *(P19)*
**What:** manage catalog/orders/customers in a spreadsheet.
**API/admin:** `GET /api/admin/products/export?format=csv` (also orders, customers); `POST
/api/admin/products/import` (multipart CSV) → validates rows against the product contract, upserts by
SKU/slug, returns a row-level report (created/updated/errors). Import runs as `draft` by default.

## 9. Better search  *(P19)*
**What:** admin search across SKU, category, tags, description — not just name.
**Data model:** relies on `sku`, `tags`, `description` already present. **API/admin:** the admin product
list `q` param matches name **or** SKU **or** tags **or** description (LIKE / FTS if added later). Note:
the **storefront** search stays as-is (name/category/tags).

## 10. Dashboard notifications  *(P18)*
**What:** a bell with New Order, Low Stock, Payment Failed, New Bridal Request.
**Data model:** **`notifications`** table: `id, type, title, body, entity, entity_id, read(bool),
created_at`. Written by the same events that drive them (order create, stock cross threshold, payment
webhook fail, bridal submit). **API/admin:** `GET /api/admin/notifications`, `PATCH .../[id]/read`,
`POST .../read-all`. (Live push is out of scope; poll on an interval.)

## 11. Media library  *(P19)*
**What:** reuse uploaded images instead of re-uploading.
**Data model:** **`media_assets`** table: `id, r2_key, url, filename, mime, size, width?, height?,
alt?, folder?, uploaded_by, created_at`. Product/category image pickers select from here or upload new.
**API/admin:** `GET /api/admin/media` (search/paginate), `POST /api/admin/media` (upload → R2 + row),
`DELETE /api/admin/media/[id]` (guard if referenced). Existing R2 flow (`08` §7) feeds this.

## 12. Rich text product description  *(P19)*
**What:** bold/lists/links/images in descriptions.
**Data model:** store sanitized HTML (or a portable JSON/Markdown) in `products.description`; add
`description_format` (`plain|html`). **Rule:** sanitize on write (server-side allow-list) and render
safely on the storefront. Admin uses a lightweight editor component. No storefront layout change beyond
rendering formatted copy.

## 13. Customer 360 (customer details)  *(P20)*
**What:** each customer page shows total orders, total spent, last order, favorite products, addresses.
**Data model:** all derived from `orders`, `favorites`, `addresses`. **API/admin:** extend
`GET /api/admin/users/[id]` with `stats { ordersCount, totalSpent, lastOrderAt }`, `recentOrders[]`,
`favorites[]`, `addresses[]`.

## 14. Coupon usage  *(P20)*
**What:** per-coupon times-used, remaining, revenue generated, customers who used it.
**Data model:** **`promo_redemptions`** table: `id, promo_code, order_id, user_id?, discount, created_at`
(written when an order applies a promo). Optional `promos.max_redemptions` for "remaining". **API/admin:**
promo detail shows usage stats derived from this table.

## 15. Soft delete / archive  *(P16, cross-cutting)*
**What:** archive + restore instead of hard delete (products at minimum; ideally categories too).
**Data model:** products use `status='archived'` (+ `archived_at`); a hard delete stays available only
when nothing references the row. **API/admin:** `DELETE` archives by default; `POST
/api/admin/products/[id]/restore` un-archives. Order history keeps referencing archived products safely.

## 16. ⭐ Audit log  *(already specced — confirm + surface)*
**What:** every admin mutation recorded with actor + before/after; viewable in the dashboard.
**Data model:** **already defined** in `02` §2.16 (`audit_log`). This adds the **viewer**: `GET
/api/admin/audit-log` (filter by actor/entity/date, paginated) + an admin page. Every enhancement
endpoint writes an audit row.

## 17. Homepage builder  *(P23 — future)*
**What:** manage Hero, Featured, New Arrivals, Collections, Promotion banners from the dashboard.
**Data model:** **`homepage_blocks`** table: `id, type(hero|featured|new_arrivals|collection|promo),
position, config(json), active, created_at`. **API/admin:** CRUD + reorder; the home page renders blocks
in order. Flagged future because it touches the storefront home layout — kept behind a feature flag.

## 18. Site settings (expanded)  *(P20)*
**What:** grow the `settings` page (`08` §Settings) to cover site name, logo, favicon, contact info,
social links, SEO defaults, footer content, WhatsApp number, shipping rules, **maintenance mode**.
**Data model:** extends the existing key-value **`settings`** table (`02` §2.15) — no new table.
**Rule:** maintenance mode is enforced in `middleware.ts` (serves a maintenance page; admins bypass).
Logo/favicon uploads use the media library (§11).

## 19. Role permissions (RBAC)  *(P21)*
**What:** more than one admin role: Admin, Manager, Order Manager, Product Manager, Content Manager, with
per-role permissions.
**Data model:** expand `users.role` enum to the above (default `customer`) **plus** a permission map.
Simplest: a code-defined `ROLE_PERMISSIONS: Record<Role, Permission[]>` (e.g.
`orders:read`, `products:write`, `settings:write`). For fully dynamic control, a **`role_permissions`**
table. (See `02` §2.5 update.) **Rule:** `requireAdmin` becomes `requirePermission(perm)`; routes/menu
items check the actor's permissions. Guard the last full **Admin** from demotion/deletion.

## 20. Activity dashboard (feed)  *(P18)*
**What:** a recent-activity stream ("Ahmed added Product X", "Mona updated Order #105").
**Data model:** derived from **`audit_log`** (§16) — no new table; render a friendly, grouped-by-day
feed. **API/admin:** `GET /api/admin/activity` (a formatted view over `audit_log`) on the dashboard.

---

## 21. Cron Triggers (scheduled Workers)  *(P22 — automation)*
Background jobs fit Cloudflare's `[triggers] crons` (scheduled Workers) and keep the storefront
responsive. Add a `server/jobs/` module; each job is a small, idempotent function invoked from the
Worker's `scheduled` handler (see `01` update).

| Job | Cadence (proposed) | Does |
| --- | --- | --- |
| Auto-cancel unpaid orders | every 15 min | cancel `card/wallet` orders still `pending` past a configurable window; **release reserved stock** (§1) |
| Pending-order reminders | daily | notify/remind on orders stuck in `placed/confirmed` |
| Expired session cleanup | daily | delete `sessions` past `expires_at` |
| Daily sales summary | daily 06:00 | write a summary row / notification (feeds §3) |
| Payment/shipment sync | hourly | reconcile Paymob/Bosta state vs local (`09` §D) for missed webhooks |

Config (windows, cadences) lives in `settings`. Jobs write to `audit_log`/`notifications` where useful.

---

## 22. Data-model additions summary (canonical detail in `02`)
- `products`: `+ slug (unique), sku, status(draft|published|hidden|archived), stock_qty, reserved_qty,
  seo_title, seo_description, og_image, canonical_url, description_format, archived_at`.
- New tables: `inventory_movements`, `order_status_history`, `notifications`, `media_assets`,
  `promo_redemptions`, `product_views`, `homepage_blocks` (future), optional `role_permissions`.
- `users.role` enum expanded (RBAC); `promos.max_redemptions?`.
- `audit_log` already exists (`02` §2.16); reused for §16 + §20.

## 23. Guardrails (keep it from over-growing)
- Storefront reads only `published`, in-stock-aware products; UI changes limited to badges + formatted
  descriptions + (flagged) homepage blocks.
- Every write still: validated by a shared contract, returns the envelope, audit-logged, permission-checked.
- Reserved stock and status changes are **atomic** (D1 transactions/`UPDATE ... WHERE`), never client-driven.
- Analytics that need visit tracking (conversion rate) stay deferred until a real analytics source exists.
- Homepage builder and dynamic RBAC table are behind flags; ship the code-config RBAC first.
