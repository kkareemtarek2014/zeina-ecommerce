# 07 — Master Acceptance Checklist

Use this to sign off the migration. The app is "done" when every box is checked against the **deployed**
Worker and the local build is green. Grouped by concern.

## Parity — UI/UX unchanged
- [ ] Home renders featured products, categories, new arrivals — visually identical to pre-migration.
- [ ] `/shop` and `/shop/[category]` show the same grids; category pills work; sort options match.
- [ ] `/product/[id]` shows gallery, related products, reviews; prices still rounded to nearest 5 EGP.
- [ ] Search modal returns the same name/category/tag matches (cap 8).
- [ ] Cart totals, coupon behavior, and order note match the old client logic.
- [ ] Checkout shipping (Cairo/Giza 50 · near 80 · far 100 · free ≥1500) is correct.
- [ ] Order confirmation + `/order/[id]` render the placed order.
- [ ] Account tabs (orders, profile, addresses, favorites, wallet, vouchers) work.
- [ ] Bridal custom form submits (now with a real file upload).
- [ ] No component markup/classes changed except `basePrice` → `price`.

## Data integrity
- [ ] Seeded counts: products 12, categories 7, governorates 27, promos 2, users 2 (customer+admin), shipping_zones 3, ≥1 sample order.
- [ ] After `pnpm db:seed`, no manual data entry needed — storefront **and** admin show existing content.
- [ ] `products.rating`/`review_count` match seeded reviews.
- [ ] Order totals are **server-computed**; sending tampered prices from the client changes nothing.
- [ ] Wallet balance = Σcredit − Σdebit (no stored balance drift).

## Security
- [ ] `basePrice` appears in **no** API response or client bundle (grep network + build).
- [ ] `password_hash` never serialized; passwords stored as PBKDF2 (salt+pepper), not plaintext.
- [ ] Session cookie is httpOnly, Secure, SameSite=Lax; no auth token in localStorage.
- [ ] Protected routes/endpoints reject unauthenticated requests (401 / redirect).
- [ ] Address/favorite/order access is ownership-scoped (can't read others' data).
- [ ] Bridal upload enforces ≤25 MB and image/video only (413/400 otherwise).
- [ ] Auth + bridal endpoints have basic rate limiting.
- [ ] Login failure message is generic (no user enumeration); forgot-password always returns ok.

## API quality
- [ ] Every endpoint returns the `{ ok, data | error }` envelope.
- [ ] Every write validates input with a shared Zod contract; errors return `VALIDATION` + details.
- [ ] Error codes/status mapping consistent (400/401/403/404/409/413/429/500).
- [ ] DTO types are Zod-inferred and shared client↔server (no `any`).

## Feature flags & SEO
- [ ] `middleware.ts` still 404s disabled routes; `wallet` off → `/api/account/wallet` 404s.
- [ ] `generateMetadata`, Product/Organization/WebSite JSON-LD intact.
- [ ] `sitemap.ts`/`robots.ts` unchanged; cart/checkout/order remain noindex/disallowed.
- [ ] Arabic keywords preserved.

## Cloudflare
- [ ] `zaya-db` (D1) created, migrated (remote), seeded.
- [ ] `zaya-uploads` (R2) created; bridal media lands there.
- [ ] `SESSION_SECRET`, `PASSWORD_PEPPER` set as Worker secrets.
- [ ] `deploy` succeeds; production smoke test passes.
- [ ] Runs within Free-tier limits for expected volume.

## Admin dashboard (P8–P12 — see `08-admin-dashboard.md`)
- [ ] `/admin` requires `admin` role; non-admins get 403; unauthenticated redirect to login.
- [ ] Admin shell: responsive sidebar, topbar, breadcrumbs, toasts, loading states.
- [ ] Products: list (search/filter/paginate), create/edit/delete, R2 image upload/replace/delete; delete blocked when referenced.
- [ ] Categories: create/edit/delete; delete blocked when products reference it.
- [ ] Orders: list/filter/detail; status transitions validated (no illegal jumps); no create/delete.
- [ ] Users: list/view/edit (name/phone/role)/delete; cannot delete/demote self or the last admin.
- [ ] Locations: governorate CRUD + shipping-zone fee edit → checkout shipping reflects the change.
- [ ] Settings: profit margin clamped 0.20–0.30; margin change → storefront prices update (effective settings).
- [ ] Promos CRUD + activate/deactivate; bridal requests viewable (media from R2) and markable answered.
- [ ] Dashboard stats (counts, revenue, ordersByStatus, recent orders, latest products, sales chart) match DB.
- [ ] Confirmation dialogs on all destructive actions; every admin write validated + audit-logged.
- [ ] `basePrice` visible only in admin (`AdminProductDTO`), never in storefront responses.

## Integrations — Paymob & Bosta (P13–P15 — see `09-integrations-bosta-paymob.md`)
- [ ] Checkout offers `cod` (unchanged), `card`, `wallet`; COD flow works exactly as before.
- [ ] Card/wallet: order created `pending` → Paymob checkout → **webhook** flips to `paid`/`confirmed`.
- [ ] Paymob webhook verifies **HMAC-SHA512**; invalid signature → 403 and no state change.
- [ ] Payment webhook is idempotent (dedupe on transaction id); failed payment allows retry.
- [ ] Gateway amount = server order total × 100 (piasters); never derived from the client.
- [ ] Paid/confirmed order auto-creates a **Bosta** delivery with correct COD amount + address.
- [ ] Governorate → Bosta city/zone mapping resolves for all 27 governorates.
- [ ] Bosta webhook maps delivery state → `OrderStatus`; idempotent; signature/secret verified.
- [ ] Tracking number + link shown on order confirmation, account order, and admin.
- [ ] Admin can create/refresh a Bosta shipment and see payment status per order.
- [ ] Secrets (`PAYMOB_*`, `BOSTA_*`) set in Wrangler; **production** keys used at go-live.
- [ ] Reconciliation: order ↔ payment ↔ shipment states are consistent.

## Production enhancements (P16–P23 — see `10-enhancements.md`)
Top-5 first (⭐):
- [ ] ⭐ **Inventory:** `stock_qty`/`reserved_qty`, `inventory_movements` history, manual adjustments with reason, low-stock warnings, out-of-stock badge; stock reserved at checkout and released on cancel/expiry.
- [ ] ⭐ **Order timeline:** every status transition written to `order_status_history` (checkout, admin, Paymob, Bosta) and rendered as a timeline.
- [ ] ⭐ **Bulk actions:** select-many → archive/publish/hide/change-category/export with confirm dialog.
- [ ] ⭐ **Product duplication:** clone → `draft` copy (new id/slug/SKU) ready to edit.
- [ ] ⭐ **Audit log viewer + activity feed** over `audit_log`; every admin write is logged.

Remaining:
- [ ] Product `status` (draft/published/hidden/archived); storefront shows only `published`.
- [ ] Per-product SEO fields (title/description/OG/canonical/slug) with fallback to auto-generation.
- [ ] Soft delete/archive + restore; order history keeps referencing archived products.
- [ ] CSV import/export (products/orders/customers); import upserts by SKU/slug as `draft`.
- [ ] Media library (reuse images) backed by `media_assets`; rich-text descriptions (sanitized).
- [ ] Better admin search (SKU/tags/description); dashboard notifications bell.
- [ ] Customer 360 (orders/spent/last/favorites/addresses); coupon usage stats (`promo_redemptions`).
- [ ] Expanded dashboard analytics (revenue today/month, best sellers, most viewed, top categories, AOV, new customers).
- [ ] Expanded site settings (logo/favicon/contacts/social/WhatsApp/SEO defaults/footer/maintenance mode).
- [ ] RBAC roles (Admin/Manager/Order/Product/Content) + permission checks on routes/menus.
- [ ] Cron Triggers: auto-cancel unpaid + release stock, reminders, session cleanup, daily summary, payment/shipment sync — all idempotent.
- [ ] (Future/flagged) Homepage builder via `homepage_blocks`.

## Build gates (must be green every phase)
- [ ] `pnpm build` — 0 errors.
- [ ] `pnpm typecheck` — 0 errors.
- [ ] `pnpm lint` — 0 errors (1 known benign RHF `watch()` warning allowed per CLAUDE.md).

## Docs
- [ ] `API.md` created at repo root documenting the live contract (CLAUDE.md TODO closed).
- [ ] `CLAUDE.md` "Known Placeholders / TODO" updated (dummy layer → seed-only; bridal upload done).
