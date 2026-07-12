# 01 — Architecture & Folder Structure

Goal: same UI/UX, powered by a real backend running **entirely on Cloudflare**. Frontend stays
Next.js App Router; the "dummy data layer" is replaced by D1 through Route Handlers and a thin
repository/service layer. Client components keep talking to the **existing feature services** — only
the service bodies change from "read local array" to "fetch API".

---

## 1. Stack additions

| Concern | Choice | Why |
| --- | --- | --- |
| Hosting/runtime | **Cloudflare Workers** via **`@opennextjs/cloudflare`** | Runs Next.js 16 App Router (Route Handlers, RSC, middleware) on Workers. `next-on-pages` is legacy; OpenNext is the current adapter. |
| Database | **Cloudflare D1** (SQLite) | Free tier fits a 10–50 product / few-hundred-orders shop. |
| ORM | **Drizzle ORM** + `drizzle-kit` | Type-safe, first-class D1 driver, SQL-migrations. |
| File storage | **Cloudflare R2** | Only for bridal-request photo/video uploads. |
| Sessions | **D1 `sessions` table** + opaque token in **httpOnly cookie** | Matches "no tokens in localStorage"; easy server-side revocation. |
| Secrets | **Wrangler secrets** | Password pepper, cookie signing secret. |
| KV | **not used initially** | Nothing needs it yet; add later for rate-limiting/caching if required. |

Password hashing uses the **Web Crypto API** (`crypto.subtle`, PBKDF2-SHA256) — bcrypt/argon native
modules don't run on Workers. See `02` and `03` for the exact scheme.

---

## 2. Cloudflare resources (in account `kkareemtarek2@gmail.com`)

Create once (commands in `05-plan.md` Phase 0). Names are proposals — keep them consistent.

| Resource | Name | Binding | Notes |
| --- | --- | --- | --- |
| D1 database | `zaya-db` | `DB` | one DB, all tables |
| R2 bucket | `zaya-uploads` | `UPLOADS` | bridal request media; public read via a Worker route or signed URL |
| Secret | — | `SESSION_SECRET` | signs/validates session cookie |
| Secret | — | `PASSWORD_PEPPER` | appended before hashing |
| Secrets | — | `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_ID_CARD`, `PAYMOB_INTEGRATION_ID_WALLET` | Paymob payments (see `09`) |
| Secrets | — | `BOSTA_API_KEY`, `BOSTA_WEBHOOK_SECRET`, `BOSTA_BUSINESS_ID` | Bosta shipping (see `09`) |
| Secrets | — | `SCRAPER_API_KEY`, `FX_API_KEY?` | Temu importer + USD/EGP rate (see `11`) |
| Worker | `zaya-store` | — | the OpenNext-built app |

`wrangler.toml` (or `wrangler.jsonc`) declares the bindings; the OpenNext build wires them into the
Worker. Local dev uses `wrangler d1`'s local SQLite + Miniflare, so no cloud calls during dev.

---

## 3. Runtime request flow

```
Browser (React Query hook)
      │  fetch('/api/...')  — same-origin, cookie auto-sent
      ▼
Next.js Route Handler  (src/app/api/**/route.ts)   [Workers runtime]
      │  validate (zod)  →  auth (session)  →  call service
      ▼
Service  (business rules: pricing, shipping, promo, order totals)
      │
      ▼
Repository  (Drizzle queries)  ──►  D1 (SQL)
      │                          └─►  R2 (bridal media)
      ▼
Consistent JSON envelope  { ok, data | error }
```

RSC pages (home, shop, product) can call the **repository/service directly** on the server for the
initial render (no self-fetch), while client components use the fetch-backed services + React Query.
Both go through the same service layer, so business rules live in exactly one place.

---

## 4. Target folder structure

Keep the existing feature-first layout. Add a `server/` tree for backend-only code and an `app/api`
tree for Route Handlers. Nothing in `src/features/*/components` should import from `server/`.

```
src/
├── app/
│   └── api/                          # Route Handlers (thin: validate → service → envelope)
│       ├── products/route.ts         # GET (list, ?category=, ?featured=, ?sort=)
│       ├── products/[id]/route.ts    # GET one
│       ├── products/[id]/related/route.ts
│       ├── products/new/route.ts
│       ├── products/search/route.ts
│       ├── categories/route.ts
│       ├── governorates/route.ts
│       ├── promos/validate/route.ts  # POST
│       ├── orders/route.ts           # POST create, GET list (auth)
│       ├── orders/[id]/route.ts      # GET one
│       ├── bridal-requests/route.ts  # POST (multipart → R2)
│       ├── reviews/route.ts          # GET ?productId= , POST (auth)
│       ├── auth/register/route.ts
│       ├── auth/login/route.ts
│       ├── auth/logout/route.ts
│       ├── auth/forgot-password/route.ts
│       ├── auth/me/route.ts          # GET current session user
│       └── account/
│           ├── profile/route.ts      # GET, PUT (auth)
│           ├── addresses/route.ts    # GET, POST (auth)
│           ├── addresses/[id]/route.ts # DELETE (auth)
│           ├── favorites/route.ts    # GET, PUT (replace set) (auth)
│           └── wallet/route.ts       # GET (auth, flag-gated)
│       └── admin/                    # ⭐ admin dashboard APIs (requireAdmin) — see 08
│           ├── stats/route.ts
│           ├── products/… categories/… orders/… users/…
│           ├── governorates/… shipping-zones/… promos/… bridal-requests/…
│           └── settings/route.ts
│       ├── payments/paymob/intention/route.ts   # create Paymob intention (see 09)
│       ├── payments/[orderId]/route.ts           # payment status (confirmation polling)
│       └── webhooks/
│           ├── paymob/route.ts                   # HMAC-verified payment callback
│           └── bosta/route.ts                    # delivery status updates
│
├── server/                           # backend-only (never imported by client components)
│   ├── db/
│   │   ├── client.ts                 # getDb(env) → drizzle(env.DB)
│   │   ├── schema/                   # one Drizzle file per table + index.ts barrel
│   │   │   ├── products.ts  categories.ts  users.ts  sessions.ts
│   │   │   ├── orders.ts    order-items.ts addresses.ts favorites.ts
│   │   │   ├── reviews.ts   promos.ts      wallet-transactions.ts
│   │   │   ├── bridal-requests.ts  governorates.ts  index.ts
│   │   ├── migrations/               # drizzle-kit output (SQL)
│   │   └── seed.ts                   # ports src/shared/data → D1
│   ├── repositories/                 # data access only, one per aggregate
│   │   ├── products.repo.ts  categories.repo.ts  orders.repo.ts
│   │   ├── users.repo.ts     sessions.repo.ts     addresses.repo.ts
│   │   ├── favorites.repo.ts reviews.repo.ts      promos.repo.ts
│   │   ├── wallet.repo.ts    bridal-requests.repo.ts governorates.repo.ts
│   ├── services/                     # business rules (SOLID; pure where possible)
│   │   ├── pricing.service.ts        # reuses shared/utils/price
│   │   ├── shipping.service.ts       # reuses checkout/utils/shipping
│   │   ├── promo.service.ts          # authoritative coupon validation
│   │   ├── order.service.ts          # builds + prices an order from cart payload
│   │   ├── product.service.ts        # maps rows → public DTO (strips basePrice!)
│   │   ├── auth.service.ts           # register/login/reset, hashing
│   │   └── upload.service.ts         # R2 put/get for bridal media
│   ├── auth/
│   │   ├── password.ts               # hash()/verify() via Web Crypto PBKDF2
│   │   ├── session.ts                # create/verify/destroy + cookie helpers
│   │   ├── require-auth.ts           # guard used inside Route Handlers
│   │   └── require-admin.ts          # requireAuth + role==='admin' (see 08)
│   ├── http/
│   │   ├── envelope.ts               # ok(data) / fail(code,msg,status)
│   │   ├── errors.ts                 # AppError, NotFound, Unauthorized, ...
│   │   └── handler.ts                # withHandler(): try/catch → envelope
│   └── jobs/                         # scheduled Workers (Cron Triggers) — see 10 §21 + 11 §5
│       ├── cancel-unpaid-orders.ts   # + release reserved stock
│       ├── order-reminders.ts  session-cleanup.ts
│       ├── daily-sales-summary.ts  payment-shipment-sync.ts
│       ├── temu-stock-sync.ts        # source OOS → stock_qty=0 (11 §3)
│       ├── fx-rate-refresh.ts        # USD/EGP → reprice (11 §5)
│       └── index.ts                  # dispatch from the Worker `scheduled` handler
│
├── shared/
│   ├── contracts/                    # ⭐ zod schemas + inferred DTO types shared client+server
│   │   ├── product.contract.ts       # ProductDTO, list query params
│   │   ├── order.contract.ts         # CreateOrderInput, OrderDTO
│   │   ├── auth.contract.ts          # re-exports feature auth schemas
│   │   ├── promo.contract.ts   review.contract.ts   account.contract.ts
│   │   └── envelope.ts               # ApiResponse<T> type
│   ├── lib/
│   │   └── api-client.ts             # typed fetch wrapper (envelope-aware, throws AppError)
│   ├── data/                         # ⬅ becomes SEED-ONLY (imported by server/db/seed.ts)
│   └── ... (types, hooks, utils unchanged)
│
└── features/                         # UNCHANGED components; only service bodies + hooks updated
```

### Why this structure

- **Route Handler → Service → Repository** = clear separation (SOLID, testable). Handlers stay thin.
- **`shared/contracts`** = one Zod schema per payload, imported by both the client (form validation +
  typed responses) and the server (input validation). No duplicated types, no `any`.
- **`shared/data` survives as seed only** — honours the CLAUDE.md rule and gives migrations their source.
- **Repositories** isolate Drizzle so services never build raw SQL; swapping a query touches one file.
- Existing feature folders keep their barrel exports; external code still imports from
  `features/[name]/index.ts`.

> **Admin dashboard** adds `src/app/admin/**` (pages) and `src/features/admin/**` (shell, forms, hooks)
> plus new reusable UI primitives (`DataTable`, `Pagination`, `Dialog`, `Toast`, `Tabs`) in
> `shared/components/ui`. It reuses this same `server/` backend, gated by `requireAdmin`. Full layout in
> `08-admin-dashboard.md`. The storefront UI is untouched by the admin surface.

> **Integrations (Paymob + Bosta)** add `server/services/{paymob,bosta}.service.ts`,
> `server/repositories/{payments,shipments}.repo.ts`, and webhook handlers under `app/api/webhooks/*`.
> Providers are called with plain `fetch` (no SDKs → Workers-safe). Webhooks bypass session auth but must
> verify the provider signature. Full spec in `09-integrations-bosta-paymob.md`.

> **Production enhancements** (`10-enhancements.md`) add operational tables/APIs (inventory, order
> timeline, notifications, media library, RBAC, …) and **scheduled Workers (Cron Triggers)**. Jobs live
> in `server/jobs/` and are dispatched from the Worker's `scheduled` handler; register cadences in
> `wrangler.toml` under `[triggers] crons`. Jobs (auto-cancel unpaid orders + release reserved stock,
> pending-order reminders, expired-session cleanup, daily sales summary, payment/shipment sync) are
> small, idempotent, and read config from `settings`. Cron never touches the request path, keeping the
> storefront responsive.

> **Sourcing & pricing (`11-sourcing-pricing-merchandising.md`)** adds `server/services/{temu-import,
> pricing}.service.ts` (scraper API abstracted; landed-cost engine as the single price authority), the
> `temu-stock-sync` + `fx-rate-refresh` cron jobs, and bundle/pre-order logic in the cart/checkout
> service. External calls (scraper, FX) use plain `fetch`; automation covers catalog + inventory only —
> **never** auto-purchasing at checkout (compliance, `11` §4).

---

## 5. Environment & bindings typing

Add an `Env`/`CloudflareEnv` type so `env.DB`, `env.UPLOADS`, secrets are typed. In Route Handlers on
OpenNext use `getCloudflareContext()` to reach bindings. Example contract (spec, not final code):

```ts
// src/server/db/client.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
export function getDb(db: D1Database) {
  return drizzle(db, { schema });
}
```

```ts
// inside a Route Handler
import { getCloudflareContext } from '@opennextjs/cloudflare';
const { env } = getCloudflareContext();
const db = getDb(env.DB);
```

Config files to add: `wrangler.toml`, `drizzle.config.ts`, `open-next.config.ts`, plus
`env.d.ts` declaring `interface CloudflareEnv { DB: D1Database; UPLOADS: R2Bucket; SESSION_SECRET: string; PASSWORD_PEPPER: string }`.

---

## 6. Non-negotiables carried over from CLAUDE.md

- TypeScript `strict`, **no `any`**, no Redux.
- Barrel exports; no deep imports across features.
- All data access via services (now: services → repositories → D1).
- Mobile-first, WCAG (`aria-label`, real `<label>`s), CSS-only animations, `useHydrated()` gating.
- SEO intact: keep `generateMetadata`, JSON-LD, sitemap/robots. RSC reads go through the same services.
- `basePrice` never leaves the server.
