# 11 — Sourcing, Dynamic Pricing & Merchandising

Turns Zaya from a fixed-margin catalog into a **Temu-sourced operation** with automated landed-cost
pricing, catalog import + stock sync, a compliant fulfilment model, and merchandising that lifts AOV and
trust. Builds on the backend (`00`–`07`), admin (`08`), integrations (`09`), and enhancements (`10`).

> ⚠️ **Business-logic change:** this **replaces** the current flat pricing (`basePrice EGP × 1.25`, `10`
> unaffected) with a **landed-cost engine**. It also introduces sourcing/fulfilment logic that isn't in
> today's storefront. Ship behind feature flags and migrate deliberately (see §7).
>
> ⚠️ **Verify the numbers.** Customs duty, VAT, handling fees, and the USD/EGP rate change over time and
> by product category — they are **settings-driven**, not hardcoded, and should be confirmed with a
> customs broker / current Egyptian regulations before go-live. Treat the defaults here as placeholders.

---

## 1. Dynamic pricing engine (landed cost → sale price)

**Goal:** protect margin against EGP volatility by pricing from the true **landed cost** of a
Temu-sourced item, then applying a target net margin. All computation is **server-side**; the browser
never sees cost inputs.

### 1.1 Inputs (all in `settings`, except the per-product base)
| Key | Default (verify) | Meaning |
| --- | --- | --- |
| per-product `base_price_usd` | — | Temu item price in USD (from importer) |
| `usd_egp_rate` | live | USD→EGP rate, refreshed by cron from an FX API (`fx_rates`) |
| `bulk_shipping_usd` | `2.00` | avg inbound shipping per item |
| `customs_duty_rate` | `0.105` | Gamarek duty on CIF |
| `vat_rate` | `0.14` | VAT |
| `handling_fee_egp` | `100` | fixed ACI/handling per item (drops with larger orders) |
| `target_margin` | `0.50` | net margin on landed cost |
| `price_rounding_egp` | `5` | round up to nearest N EGP |

### 1.2 Formula (compounding, standard Egyptian import basis)
```
itemEGP     = base_price_usd     × usd_egp_rate
shippingEGP = bulk_shipping_usd  × usd_egp_rate
cifEGP      = itemEGP + shippingEGP
customsEGP  = cifEGP × customs_duty_rate          # Gamarek on CIF
vatEGP      = (cifEGP + customsEGP) × vat_rate     # VAT on CIF + duty
landedCost  = cifEGP + customsEGP + vatEGP + handling_fee_egp
sellPrice   = ceil( landedCost × (1 + target_margin) / price_rounding_egp ) × price_rounding_egp
```
- `landedCost` is stored as a **snapshot** on the product (`products.landed_cost`); `sellPrice` replaces
  the old `getSellPrice` output. `base_price` (existing EGP column) is repurposed to hold the landed-cost
  snapshot for backward compatibility, or superseded by `landed_cost` — pick one and keep it consistent.
- Recompute on: product import/edit, and whenever `usd_egp_rate` or any pricing setting changes (a cron
  re-prices all Temu-linked products — §5).
- `pricing.service.ts` implements this; `getSellPrice` is refactored to `computeSellPrice(product,
  settings)` and stays the **single** price authority. `compareAtPrice` (sale styling) still supported.

### 1.3 Migration from the flat model
- Old constant `PROFIT_MARGIN = 0.25` (25% on EGP cost) → new `target_margin = 0.50` (net on landed
  cost). The two use different bases, so **do not** treat them as equal — recompute prices at cutover and
  review before publishing.
- Feature flag `dynamic_pricing`: OFF = current flat model (unchanged storefront); ON = landed-cost
  engine. Seeded products without `base_price_usd` fall back to the flat model until re-imported/priced.

---

## 2. Temu importer (catalog automation)

**Goal:** paste a Temu URL in admin → auto-map product data into D1. **Do not** build a custom scraper
(brittle when Temu changes) — call a **third-party scraper / unified-commerce API** (e.g. Piloterr,
SearchAPI, API2Cart). Provider is abstracted behind one service so it can be swapped.

- **Service:** `server/services/temu-import.service.ts` — `fetchTemuProduct(url) → NormalizedProduct`
  (title, description, high-res images, variants, `base_price_usd`, `source_product_id`, in-stock).
  Images are pulled into **R2** (media library, `10` §11); description seeds the rich-text field (`10`
  §12) for later localization.
- **Admin flow:** `POST /api/admin/import/temu` `{ url }` → returns a **draft** `AdminProductDTO`
  (status `draft`, `fulfilment_type` default, price computed via §1) for the admin to review/localize
  before publishing. Never auto-publish.
- **Secret:** `SCRAPER_API_KEY` (Wrangler). Rate-limit + cache imports; log to `audit_log`.
- **Data:** products gain `source_provider('temu')`, `source_url`, `source_product_id`,
  `source_variant_map(json)`, `source_in_stock(bool)`, `last_synced_at`.

---

## 3. Real-time inventory sync (dropshipping-critical)

Temu stock fluctuates fast; never sell what you can't fulfil.
- **Cron job** (`server/jobs/temu-stock-sync.ts`, every few hours — extends `10` §21 / P22): for each
  Temu-linked product, ping the scraper API; if the source is **out of stock**, set local `stock_qty=0`
  (and `source_in_stock=false`), which flips the storefront to out-of-stock / pre-order (§5.2). When it
  returns, restock logic is manual/admin (don't auto-inflate stock you may not physically hold — see
  fulfilment §4).
- **Idempotent**, batched, respects API rate limits; writes `inventory_movements` (`reason='sync'`) and
  a `low_stock`/`out_of_stock` notification (`10` §10).
- Cadence + batch size configurable in `settings`.

---

## 4. Fulfilment model — micro-warehousing (compliance)

> Temu's terms generally **prohibit traditional dropshipping** (auto-ordering to ship directly to the
> customer in Temu packaging risks a buyer-account ban). **Verify Temu's current ToS yourself.** The
> documented operating model avoids this:

1. Use the API to **sync catalog + track inventory** only.
2. **Bulk-buy** popular items on Temu → ship to a Zaya location in Egypt.
3. **Repackage** in Zaya-branded boxes.
4. **Ship locally via Bosta** (`09` Part B).

**Data/logic:** `products.fulfilment_type ∈ { local_stock, dropship }`.
- `local_stock` = physically held/repackaged → **fast** timeline (e.g. 1–2 days), real `stock_qty`.
- `dropship` = sourced on demand → **long** timeline (e.g. 2–3 weeks), `stock_qty` mirrors Temu.
- **Checkout never places a Temu order.** Orders always fulfil via Bosta from local stock or a manual
  bulk-buy workflow. This keeps automation on catalog/inventory, not purchasing.

Shipping timelines (per type) live in `settings` and show on the product page (§6.3).

---

## 5. Where automation runs (cron summary — extends `10` §21 / P22)
| Job | Cadence | Does |
| --- | --- | --- |
| `temu-stock-sync` | every few hours | source OOS → local `stock_qty=0`; notify |
| `fx-rate-refresh` | daily | update `usd_egp_rate` from FX API → **re-price** all Temu-linked products |
| `landed-cost-reprice` | on rate/settings change | recompute `landed_cost` + `price` snapshots |

`fx-rate-refresh` uses a public FX API (secret `FX_API_KEY` if the provider needs one); stores history in
`fx_rates` for audit and stable pricing between refreshes.

---

## 6. Merchandising & UI (intentional, additive — flag-gated)

These **do** change the storefront (unlike the data-layer migration), so each ships behind a flag and
uses the existing Tailwind v4 tokens / mobile-first design.

### 6.1 Bundles & upselling — raise AOV, offset fixed shipping
- **`bundles`** table: `id, name, type(bxgy|set|fixed_price), config(json), active, starts_at?, ends_at?`
  + **`bundle_items`** (`bundle_id, product_id, qty`). Examples: *Buy 2 Get 1 Free* (`bxgy`), *Accessory
  Set* at a fixed price (`fixed_price`/`set`).
- **Cart logic:** the cart/promo engine (`shared/data/promos` → server promo service) evaluates active
  bundles and applies the best discount; discount recomputed server-side at checkout (never client).
- **Admin:** Bundles CRUD (`/api/admin/bundles`), scheduling, activate/deactivate.
- **Storefront:** bundle callouts on product/cart; a "Frequently bought together" block.

### 6.2 Pre-orders — capture demand on OOS popular items
- **Data:** `products.preorder_enabled(bool)`, `preorder_eta_days` (or a timeline label). When
  `stock_qty=0` **and** `preorder_enabled`, allow ordering; the order line is flagged `is_preorder` and
  the order carries an **extended ETA**.
- **Checkout:** pre-order items are clearly labelled; timeline messaging is explicit (e.g. "Ships in
  2–3 weeks"). Optionally require prepayment (Paymob) for pre-orders to reduce cancellations.
- **Admin:** pre-order list + fulfil-when-restocked workflow; a pre-order notification on new demand.

### 6.3 Shipping timelines on the product page
- Show a clear ETA from `fulfilment_type` + `settings`: **1–2 days** (local stock) vs **2–3 weeks**
  (dropship/pre-order). Read from the product DTO; render near add-to-bag. Reduces "where is my order"
  support load and sets expectations.

### 6.4 Trust & social proof
- **Reviews:** already specced (`02` reviews table, `03` §7). Surface rating summary + reviews on product
  pages (already present) and consider verified-purchase badges.
- **Instagram feed / social proof:** a storefront section rendering recent posts. Keep it simple: an
  embed/config in `settings` (`instagram_handle`, embed token) or an optional `instagram_posts` cache
  table refreshed by cron. Flag-gated; no heavy third-party JS on critical render path.
- **Localized descriptions:** rewrite Temu's generic copy for Egyptian fashion trends + materials, using
  the rich-text field (`10` §12). Importer seeds raw copy as `draft`; admin localizes before publish.

---

## 7. Rollout (phases — continue `05-plan.md`, after P16–P23)

- **P24 — Dynamic pricing engine:** pricing settings + `fx_rates`; `pricing.service` landed-cost calc;
  `base_price_usd`/`landed_cost` columns; `fx-rate-refresh` + reprice cron; `dynamic_pricing` flag.
  **Verify:** a known USD base yields the expected EGP price; rate change re-prices; flag OFF = old model.
- **P25 — Temu importer + stock sync:** `SCRAPER_API_KEY`; `temu-import.service` + `POST
  /api/admin/import/temu`; source columns; `temu-stock-sync` cron; media/rich-text wiring.
  **Verify:** pasting a Temu URL creates a review-ready draft with images in R2 + USD base priced;
  simulated source-OOS sets `stock_qty=0` + notifies.
- **P26 — Merchandising & trust:** `bundles`(+items), pre-order fields/flow, shipping-timeline UI,
  Instagram/social-proof section, localized-description workflow. **Verify:** Buy-2-Get-1 applies
  server-side; pre-order allowed only when enabled + OOS with correct ETA; timelines show per fulfilment
  type; flags gate each feature.
- **Fulfilment ops (P4/§4):** micro-warehousing is process + the `fulfilment_type` flag; no auto-Temu
  purchasing anywhere in checkout.

---

## 8. Task checklist
**Pricing (P24)**
- [ ] `settings`: `usd_egp_rate, bulk_shipping_usd, customs_duty_rate, vat_rate, handling_fee_egp, target_margin, price_rounding_egp`; `fx_rates` table.
- [ ] `products`: `base_price_usd`, `landed_cost`; refactor `getSellPrice`→`computeSellPrice(product,settings)` (single authority, server-only cost inputs).
- [ ] `fx-rate-refresh` (daily) + `landed-cost-reprice` (on change) cron; `dynamic_pricing` flag; migrate/re-price at cutover.
- [ ] [V] formula matches §1.2 for a sample item; rate change re-prices; flag OFF keeps old prices; no cost inputs in any API response.

**Importer + sync (P25)**
- [ ] `SCRAPER_API_KEY`; `temu-import.service` (provider-abstracted) + `POST /api/admin/import/temu` → draft product.
- [ ] `products`: `source_provider, source_url, source_product_id, source_variant_map, source_in_stock, last_synced_at`; images→R2; description→rich text.
- [ ] `temu-stock-sync` cron (config cadence/batch); writes `inventory_movements` + notifications.
- [ ] [V] URL import creates review-ready draft; source-OOS → `stock_qty=0`; rate-limited + audit-logged; no auto-publish.

**Merchandising (P26)**
- [ ] `bundles` + `bundle_items`; server bundle evaluation in cart/checkout; admin Bundles CRUD + scheduling.
- [ ] Pre-order: `preorder_enabled`/`preorder_eta_days`, `order_items.is_preorder`, labelled checkout + ETA; admin pre-order list.
- [ ] Shipping-timeline UI from `fulfilment_type` + settings; Instagram/social-proof section (flag); localized-description workflow.
- [ ] [V] Buy-2-Get-1 applied server-side; pre-order gated (enabled + OOS) with correct ETA; timelines correct per type; each behind a flag.

**Fulfilment/compliance**
- [ ] `fulfilment_type` on products drives stock + timeline; checkout never orders from Temu (Bosta only).
- [ ] Customs/VAT/handling rates confirmed against current regulations before go-live (settings-driven).

## 9. Data-model additions summary (canonical detail in `02`)
- `products`: `+ base_price_usd, landed_cost, source_provider, source_url, source_product_id,
  source_variant_map(json), source_in_stock, last_synced_at, fulfilment_type(local_stock|dropship),
  preorder_enabled, preorder_eta_days`.
- `order_items`: `+ is_preorder`.
- New tables: `bundles`, `bundle_items`, `fx_rates`, optional `instagram_posts`.
- `settings`: pricing-engine keys (§1.1), shipping-timeline labels, Instagram config, cron cadences.
- New flags (`features.config.ts`): `dynamic_pricing`, `bundles`, `preorders`, `social_proof`.

## 10. Guardrails
- Cost inputs (`base_price_usd`, `landed_cost`, rates) are **server-only**; DTOs expose `price` /
  `compareAtPrice` and timeline labels only.
- One price authority (`computeSellPrice`); prices/discounts/bundles always recomputed server-side.
- Automation covers **catalog + inventory**, never **purchasing/checkout** (compliance §4).
- Every rate/fee is configurable and audit-logged; verify against real regulations, don't hardcode certainty.
- Merchandising features are flag-gated so the storefront can adopt them incrementally.

## Sources (verify current details before implementing)
- Scraper/unified-commerce APIs: Piloterr, SearchAPI, API2Cart (choose one; abstract behind the service).
- Egyptian import duties/VAT and Temu Terms of Service change over time — confirm with a customs
  broker / official sources and Temu's current ToS.
