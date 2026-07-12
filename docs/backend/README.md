# Zaya — Backend Implementation Docs

Turn the frontend-only Zaya storefront into a full-stack app on **Cloudflare** (Workers + D1 + R2)
**without changing the storefront UI/UX**, then add a **production-ready admin dashboard** (`08`) to
manage all existing data. These docs are the complete, detailed spec so implementation (by a person or
an AI agent) is mechanical: read in order, follow the phases (P0–P7 storefront, P8–P12 admin, P13–P15
payments/shipping, P16–P23 production enhancements), check the boxes.

> Ground rule (from the original brief): **every backend feature maps to an existing frontend feature.**
> Nothing is invented. Re-verify against the code before building — see `00-analysis.md`.

## Read in this order

| # | File | What it gives you |
| --- | --- | --- |
| 00 | [00-analysis.md](./00-analysis.md) | Full frontend inventory: pages, static data, stores, flows, business logic, out-of-scope list. |
| 01 | [01-architecture.md](./01-architecture.md) | Cloudflare stack, request flow, and the **target folder structure** (server/repos/services/contracts). |
| 02 | [02-data-model.md](./02-data-model.md) | Every D1 table + rationale, relationships, **Drizzle schemas**, migrations, seeding. |
| 03 | [03-api-contracts.md](./03-api-contracts.md) | Every endpoint: method, path, request/response DTOs, validation, errors, envelope. |
| 04 | [04-frontend-integration.md](./04-frontend-integration.md) | How to swap static data → API through existing services + new reusable hooks. |
| 05 | [05-plan.md](./05-plan.md) | Phased implementation plan (P0–P7) with dependencies and risks. |
| 06 | [06-tasks.md](./06-tasks.md) | Granular, checkable task list per phase (incl. verification tasks). |
| 07 | [07-checklist.md](./07-checklist.md) | Master acceptance checklist for sign-off. |
| 08 | [08-admin-dashboard.md](./08-admin-dashboard.md) | **Admin dashboard**: modules, auth/roles, admin API, folder structure, phases P8–P12, seeders, checklist. |
| 09 | [09-integrations-bosta-paymob.md](./09-integrations-bosta-paymob.md) | **Paymob** (card/wallet payments, Intention API + HMAC webhook) & **Bosta** (delivery, COD, tracking webhook): flows, data, phases P13–P15. |
| 10 | [10-enhancements.md](./10-enhancements.md) | **Production enhancements**: inventory, order timeline, analytics, drafts/SEO, duplication, bulk, CSV, media library, RBAC, notifications, audit viewer, **Cron Triggers** — phases P16–P23 (top-5 flagged). |

## Decisions locked for this project
- **Docs location:** `docs/backend/` (this folder).
- **Auth:** session token in a **D1 `sessions` table** + opaque token in an **httpOnly cookie** (no
  tokens in localStorage; passwords hashed with Web Crypto PBKDF2).
- **Scope:** full — includes `wallet` (ships behind its existing OFF flag), `reviews` (replaces the
  hardcoded component array), and `recently-viewed` (stays client-side UX).
- **Admin dashboard:** in scope (`08`). Single `users` table with a `role` (`customer|admin`); admin UI
  under `/admin`, APIs under `/api/admin`. Manages **only** existing entities (no product variants).
- **Seeders:** all static mock data (products, categories, governorates, shipping rates, promos, users
  +admin, reviews, wallet, sample order) is converted to D1 seeders — `pnpm db:seed`, zero manual entry.
- **Payments:** **Paymob** (card + mobile wallet) via the Intention API + Unified Checkout, alongside
  COD. Webhooks (HMAC-SHA512) are the source of truth (`09`).
- **Shipping:** **Bosta** delivery with COD collection + live tracking; delivery state → order status via
  webhook (`09`).
- **Production enhancements (`10`):** inventory + stock history, order timeline, dashboard analytics,
  product drafts/SEO/duplication, bulk actions, CSV, media library, notifications, customer 360, coupon
  usage, soft-delete, audit viewer, RBAC, activity feed, and **Cron Triggers**. Top-5 build first;
  homepage builder + dynamic RBAC table are flagged/future.
- **Cloudflare account:** `kkareemtarek2@gmail.com`. Resources: `zaya-db` (D1), `zaya-uploads` (R2).

## Golden rules while implementing
1. One phase at a time; `pnpm build && pnpm typecheck && pnpm lint` must be green before moving on.
2. Route Handler stays thin: **validate → service → repository → envelope**. No logic in handlers.
3. `basePrice` and `password_hash` **never** leave the server. Prices/totals are always recomputed
   server-side.
4. Reuse the existing feature services and Zod schemas — the frontend was built for this swap. Add
   **small, reusable hooks**; don't rewrite components.
5. Keep SEO, feature flags, accessibility, and CSS-only animations intact (see `CLAUDE.md`).

## Not in scope (no data/feature exists for it)
Product **variants** (the `Product` type has none), **Fawry** or other gateways beyond Paymob, couriers
beyond Bosta, storefront product pagination, review submission UI, contact-form API (page uses
mailto/WhatsApp). Listed so nobody builds endpoints/tables for them.
