# 06 — Task Checklist (per phase)

Granular, checkable tasks. Each is small enough to implement + verify in one sitting. Check as you go.
`[V]` = verification task (do not skip).

---

## Phase 0 — Setup
- [ ] Install: `@opennextjs/cloudflare wrangler drizzle-orm drizzle-kit @cloudflare/workers-types`.
- [ ] `wrangler login` (account `kkareemtarek2@gmail.com`).
- [ ] `wrangler d1 create zaya-db` → copy `database_id`.
- [ ] `wrangler r2 bucket create zaya-uploads`.
- [ ] `wrangler secret put SESSION_SECRET` and `PASSWORD_PEPPER` (for `preview`/`deploy`; use `.dev.vars` locally).
- [ ] Add `wrangler.toml` with `[[d1_databases]]` (binding `DB`) and `[[r2_buckets]]` (binding `UPLOADS`).
- [ ] Add `open-next.config.ts`, `drizzle.config.ts`, `env.d.ts` (`interface CloudflareEnv {...}`).
- [ ] Add scripts: `preview`, `deploy`, `db:generate`, `db:migrate:local`, `db:migrate:remote`, `db:seed`.
- [ ] Temp `GET /api/health` route returning `{ ok:true }`.
- [ ] [V] `pnpm build` clean; `preview` boots; `/api/health` returns ok. Remove health route after.

## Phase 1 — DB layer
- [ ] Schemas: `categories, products, governorates, promos, users, sessions, orders, order_items, addresses, favorites, reviews, wallet_transactions, bridal_requests` + `index.ts` barrel.
- [ ] `db/client.ts` (`getDb`).
- [ ] `http/envelope.ts` (`ok`/`fail`), `http/errors.ts` (`AppError` + subclasses), `http/handler.ts` (`withHandler`).
- [ ] `shared/contracts/`: `envelope.ts, errors.ts, product.contract.ts, order.contract.ts, auth.contract.ts, promo.contract.ts, review.contract.ts, account.contract.ts`.
- [ ] `db:generate` → migration SQL; `db:migrate:local`.
- [ ] `db/seed.ts` porting all `shared/data` arrays (+ re-hash seed user, seed reviews & wallet, seed `shipping_zones` from `SHIPPING_RATES`, `settings` from `PROFIT_MARGIN`/`FREE_SHIPPING_THRESHOLD`, one `admin` user, and the `ZN-MOCK-123` sample order). Run `db:seed` (local).
- [ ] [V] Row counts: products 12, categories 7, governorates 27, promos 2, users 2 (1 customer + 1 admin), shipping_zones 3, ≥1 order; seed users hashed, not plaintext.

## Phase 2 — Catalog reads
- [ ] `products.repo`, `categories.repo`, `governorates.repo`.
- [ ] `server/services/product.service.ts` row→`ProductDTO` mapper (drop `basePrice`, add `price` via pricing).
- [ ] Routes: `products`, `products/[id]`, `products/[id]/related`, `products/new`, `products/search`, `categories`, `governorates` (+ `?category&featured&sort&q`).
- [ ] Rewrite `features/shop/services/products.service.ts` bodies → `api` calls.
- [ ] Grep & fix `basePrice`/`getSellPrice` usages in components + `cart.store` (use `product.price`). Update client `Product`→`ProductDTO`.
- [ ] RSC pages (`/`, `/shop`, `/shop/[category]`, `/product/[id]`) call server product service; keep `generateMetadata`/JSON-LD/`generateStaticParams`.
- [ ] [V] All catalog pages + search identical; no `basePrice` in any response; sort/filter/search match old behavior; `typecheck`/`lint` clean.

## Phase 3 — Auth
- [ ] `auth/password.ts` (PBKDF2 hash/verify, constant-time), `auth/session.ts` (create/verify/destroy + cookie helpers), `auth/require-auth.ts`.
- [ ] `users.repo`, `sessions.repo`, `server/services/auth.service.ts`.
- [ ] Routes: `auth/register`, `auth/login`, `auth/logout`, `auth/me`, `auth/forgot-password`.
- [ ] Rewrite `features/auth/services/auth.service.ts` → `api`; add `useLogin/useRegister/useForgotPassword/useLogout/useSession`.
- [ ] Delete `users.store`; hydrate `auth.store` from `/api/auth/me`; `AuthGuard` confirms session.
- [ ] [V] Register→auto-login (cookie set); seed login works; bad creds 401; protected route redirect; refresh persists; logout clears; no `password_hash` in responses.

## Phase 4 — Promo + Orders
- [ ] `promo.service` + `POST /api/promos/validate`; cart `applyCoupon` → API.
- [ ] `order.service` (recompute unit prices, subtotal, promo discount, shipping, total), `orders.repo`, `order_items` writes.
- [ ] Routes: `POST /api/orders`, `GET /api/orders/[id]`, `GET /api/orders` (auth).
- [ ] `usePlaceOrder`; `CheckoutForm.onSubmit` → mutation; remove `ordersStore.placeOrder` + mock order.
- [ ] [V] Order totals server-computed (tampered client prices ignored); zone shipping + free≥1500 correct; promo applied; `/order/[id]` + confirmation render; account orders list shows it for logged-in user.

## Phase 5 — Account
- [ ] Repos + routes: profile (get/put), addresses (get/post, `[id]` delete), favorites (get/put), wallet (get, flag-gated 404).
- [ ] Hooks: `useProfile/useUpdateProfile`, `useAddresses/useAddAddress/useRemoveAddress`, `useFavoritesSync`, `useWallet`.
- [ ] Rewire `ProfileForm`, `AddressBook`, `FavoritesGrid`, `MyWallet`; favorites PUT-sync on login.
- [ ] [V] Profile persists; address add/delete (ownership enforced); favorites sync; wallet balance = Σcredit−Σdebit; wallet route 404 when flag off.

## Phase 6 — Bridal + R2 + Reviews
- [ ] `upload.service` (R2 put/get), `bridal-requests.repo`, `POST /api/bridal-requests` (multipart, ≤25MB, image/video).
- [ ] `useSubmitBridalRequest` (multipart); wire `BridalRequestForm`.
- [ ] `reviews.repo` + `GET /api/reviews?productId=`; rewire `ProductReviews` (list + average + breakdown bars). `POST /api/reviews` (auth, no UI).
- [ ] [V] Bridal submit → DB row + R2 object; oversized/wrong-type rejected (413/400); reviews render from DB with correct summary; recompute updates product rating/count.

## Phase 7 — Hardening & deploy
- [ ] Audit: every write validated with a contract schema; every route returns the envelope; errors mapped to codes.
- [ ] Ensure `basePrice` & `password_hash` never serialized (add a serialization test/grep).
- [ ] Basic rate-limit on `auth/*` + bridal (optional KV); security headers.
- [ ] `db:migrate:remote` + seed remote D1; set secrets; `deploy`.
- [ ] Smoke test production URL; verify cart/checkout/order still `noindex`.
- [ ] Write `API.md` at repo root (CLAUDE.md TODO); update `SITE.url` if domain purchased.
- [ ] [V] Full `07-checklist.md` passes against deployed Worker.

## Phases 8–12 — Admin dashboard
The full, granular admin task list (auth & shell, products/categories CRUD + images, orders & users,
locations/promos/bridal/settings, dashboard stats) lives in **`08-admin-dashboard.md` §10**. Do those
after P0–P7 are green. Note the extra `users.role` migration in P8 and that pricing/shipping must read
**effective settings** once P11 lands.

## Phases 16–23 — Production enhancements
The full, granular enhancement task list (inventory ⭐, order timeline ⭐, bulk ⭐, duplication ⭐, audit
viewer ⭐, drafts/SEO, CSV, media library, notifications, customer 360, coupon usage, analytics, RBAC,
cron triggers, homepage builder) lives in **`10-enhancements.md`**. Key schema adds are in `02` §2b
(`inventory_movements`, `order_status_history`, `notifications`, `media_assets`, `promo_redemptions`,
`product_views`) plus product columns (`status/slug/sku/stock_qty/reserved_qty/SEO`). Storefront reads
only `published`, stock-aware products. Cron jobs go in `server/jobs/` (`01`).

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
