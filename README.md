<div align="center">
  <img src="https://via.placeholder.com/150x150/fbfaf6/129488?text=S" alt="Sqoosh Logo" width="120" height="120" />
  <h1>🫧 Sqoosh — Squishy Toys &amp; Stress Relief 🫧</h1>
  <p><strong>Irresistibly cute squishies (سكوش) delivered anywhere in Egypt — Cash on Delivery today; card &amp; mobile wallet coming via Paymob.</strong></p>
  <p>A playful, feature-based Next.js storefront engineered for scalability, delightful UI/UX, and robust performance.</p>
  <p><em>Rebrand in progress: docs are Sqoosh; code migration tracked in <a href="./docs/rebrand-migration-plan.md">docs/rebrand-migration-plan.md</a>.</em></p>
</div>

<hr />

## 📌 Project Status

The **frontend is feature-complete** and runs on a **dummy data layer** (static files in `src/shared/data/`
plus persisted Zustand stores). There is **no real backend yet**. The complete, phased plan to move onto
**Cloudflare** (Workers + D1 + R2), add an **admin dashboard**, and integrate **Bosta** (shipping) and
**Paymob** (payments) lives in [`docs/backend/`](./docs/backend/README.md) — start with its README.

For an at-a-glance map of the whole codebase and business rules, see [`CLAUDE.md`](./CLAUDE.md).

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router) & React 19
- **Language:** TypeScript (strict mode — no `any`)
- **Styling:** Tailwind CSS v4 (CSS-first, tokens in `src/styles/tokens.css`; no `tailwind.config.ts`)
- **Client state:** Zustand (persisted stores)
- **Server state:** React Query (TanStack)
- **Forms & validation:** react-hook-form + Zod v4
- **Icons:** lucide-react · **Package manager:** pnpm
- **Planned backend:** Cloudflare Workers (via `@opennextjs/cloudflare`) + D1 (SQLite) + Drizzle ORM + R2

---

## 🛠️ Getting Started

### Prerequisites
Node.js **v18+** and **pnpm**.

### Install & run
```bash
pnpm install     # install dependencies
pnpm dev         # start the dev server
```
Open [http://localhost:3000](http://localhost:3000).

### Quality checks (run before every commit)
```bash
pnpm build      # production build — 0 errors
pnpm typecheck  # TypeScript — 0 errors
pnpm lint       # ESLint — 0 errors (1 known benign RHF watch() warning)
```

---

## 💼 Business Rules & Configuration

Core business logic is centralized in **`src/config/site.config.ts`**.

| Setting | Description |
| :--- | :--- |
| **`PROFIT_MARGIN`** | Markup on sourcing cost (`0.25` = 25%). Allowed range 20–30%. |
| **`SHIPPING_RATES`** | Flat rate by zone — Cairo/Giza 50 EGP · Near 80 EGP · Far 100 EGP. |
| **`FREE_SHIPPING_THRESHOLD`** | Orders at/above this subtotal (1,500 EGP) ship free. |
| **`SITE`** | Brand name, tagline, description, currency (EGP), SEO keywords. |

Feature flags live in **`src/config/features.config.ts`** and drive `middleware.ts` (disabled routes →
404). Governorate-to-zone mappings live in `src/shared/data/governorates.data.ts` (all 27 governorates).
Promo codes live in `src/shared/data/promos.data.ts`.

---

## 💰 Dynamic Pricing Model

Products store a base sourcing cost (`basePrice`). The customer price is computed by `getSellPrice()` in
`src/shared/utils/price.ts`:

> **`(cost + margin) → rounded up to the nearest 5 EGP`**

Change the margin once in `site.config.ts` and every price on the site updates instantly. `basePrice` is
a secret sourcing cost and must **never** be sent to the browser once the backend exists (admin-only).

---

## 🏗️ Project Architecture (feature-based)

```text
src/
├── app/            # Next.js App Router pages (UI/layout; logic lives in features)
├── config/         # site.config.ts (business rules) · features.config.ts (flags)
├── middleware.ts   # feature-flag route gating (disabled → 404)
├── features/       # modular features (barrel-exported via index.ts)
│   ├── shop/           # catalog, category pills, sort, product services + hooks
│   ├── product/        # details, gallery, related, reviews, recently-viewed
│   ├── product-search/ # modal search over name/category/tags
│   ├── cart/           # persisted cart store, drawer, coupon, note, recommendations
│   ├── checkout/       # Egyptian-phone Zod form, shipping calc, COD → places order
│   ├── order/          # client order log, confirmation, status timeline
│   ├── account/        # profile, addresses, favorites, wallet, orders, vouchers
│   ├── auth/           # login/register/forgot, AuthGuard, mock users store
│   └── bridal-custom/  # bespoke bridal request form (photo/video)
├── shared/         # global utilities & UI kit
│   ├── components/     # UI primitives (Button, Input, Drawer…), Header, Footer
│   ├── contexts/       # FeatureContext
│   ├── data/           # dummy data layer (products, categories, governorates, promos, users)
│   ├── hooks/          # useHydrated, useFocusTrap, useEscapeKey, useScrollLock
│   ├── store/          # shared stores (favorites)
│   ├── types/          # global TypeScript interfaces
│   └── utils/          # price helpers, cn()
└── styles/         # tokens.css (brand palette — edit colors here)
```

**Architectural rules:**
- Features import only from another feature's `index.ts` barrel — never deep paths.
- All data access goes through `features/*/services/`; components never read data files directly.
- Strict typing (no `any`), no Redux, no auth tokens in localStorage.
- Mobile-first + accessible (aria-labels, real `<label>`s); animations are CSS-only.
- Components reading persisted Zustand stores must gate on `useHydrated()`.

---

## ✨ Features

- **Shop & catalog** — grid, category pills, sorting, featured & new arrivals.
- **Product details** — image gallery, add-to-bag, related products, reviews, recently-viewed.
- **Search** — modal search across product name, category, and tags.
- **Cart** — persisted store with quantity control, promo codes, order note, and recommendations.
- **Checkout** — Egyptian-phone validation, per-governorate shipping, free-shipping threshold, COD.
- **Orders** — client-side order log, confirmation page, and status timeline.
- **Accounts** *(gated by `AuthGuard`)* — profile, saved addresses, favorites/wishlist, order history,
  wallet *(feature flag OFF)*, vouchers.
- **Auth** — login / register / forgot-password (currently a mock; becomes real with the backend).
- **Bridal custom** — bespoke request form with photo/video (replies promised ≤ 2 days).
- **SEO** — metadata, Product/Organization/WebSite JSON-LD, sitemap/robots, Arabic keywords.

---

## 🔌 Backend Integration (planned)

Today the store reads from the dummy data layer. The seams are already built so the switch is mechanical
— see [`docs/backend/`](./docs/backend/README.md):

1. Stand up Cloudflare (D1 + R2) and seed the existing mock data (`pnpm db:seed`).
2. Build Route Handlers under `src/app/api/**`, then rewrite the **service bodies** (e.g.
   `features/shop/services/products.service.ts`) and store submit functions to call them.
3. **The UI/UX does not change** — components only talk to services.

The plan also covers an **admin dashboard** (`08`) and **Paymob + Bosta** integration (`09`).

---

## 🗺️ Sitemap

**Storefront:** `/` · `/shop` · `/shop/[category]` · `/product/[id]` · `/cart` · `/checkout` ·
`/order/[id]` · `/bride/custom`
**Auth:** `/auth/login` · `/auth/register` · `/auth/forgot-password`
**Account** *(protected)*: `/account` · `/account/profile` · `/account/addresses` ·
`/account/favorites` · `/account/orders` · `/account/wallet` · `/account/vouchers`
**Legal/marketing:** `/about` · `/contact` · `/privacy` · `/terms` · `/cookies`

Categories: jewelry, bags, hair, scarves, sunglasses, watches, **bride**.

---

## 🎯 Roadmap

- [ ] **Cloudflare backend** — Workers + D1 + R2 replacing the dummy data layer.
- [ ] **Admin dashboard** — manage products, categories, orders, users, locations, promos, settings.
- [ ] **Paymob payments** — card + mobile wallet alongside Cash on Delivery.
- [ ] **Bosta fulfilment** — delivery creation, COD collection, and live tracking.
- [ ] **Real auth** — hashed users + httpOnly session cookie (replaces the mock).
- [ ] **RTL support** — full Arabic localization for the Egyptian market.

Detailed, phased specs for all of the above: [`docs/backend/`](./docs/backend/README.md).

---

<div align="center">
  <p>Made with a sqoosh for Sqoosh. 🫧</p>
</div>
