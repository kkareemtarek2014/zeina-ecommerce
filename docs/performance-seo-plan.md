# Zaya — Performance, SEO & Skeleton Loading Plan

> Actionable plan for Core Web Vitals, crawlability, and perceived performance.
> Complements `docs/backend/` and the storefront rules in `CLAUDE.md`.
>
> **Last updated:** 2026-07-15

---

## Goals

1. **Faster perceived load** — section-shaped skeleton loaders everywhere data is pending (not only a full-page spinner).
2. **Better indexing** — money pages (product / shop / category) ship meaningful HTML on first response.
3. **Accurate discovery** — sitemap reflects the live D1 catalog; robots/canonicals stay correct on the real domain.
4. **Stable LCP / CLS** — real images + R2-ready `next/image`; layout doesn’t jump while content streams in.
5. **Lean JS** — heavy UI (drawers, modals, below-fold) loads on demand.

---

## Current state (audit summary)

### Already done well

| Area | Status | Where |
| --- | --- | --- |
| `next/image` + LCP `priority` | Storefront heroes & product gallery | Homepage, bridal, `ProductGallery`, cards |
| `next/font` | Jost + Playfair, `display: 'swap'` | `src/app/layout.tsx` |
| Root metadata / OG / Twitter / canonical | Present | `layout.tsx` |
| `generateMetadata` | Product + shop category | `product/[id]`, `shop/[category]` |
| Product JSON-LD | Product + Offer + AggregateRating | `product/[id]/page.tsx` |
| Sitemap + robots | App Router files exist | `src/app/sitemap.ts`, `robots.ts` |
| noindex | Cart, checkout, order, account, admin | Route metadata |
| Semantic chrome | `header` / `main` / `footer` | Storefront layout |
| Package import trim | `lucide-react` | `next.config.ts` |
| Third-party scripts | None | Protect this |

### Gaps (ranked)

| Priority | Gap | Why it hurts |
| --- | --- | --- |
| P0 | Product / shop body mostly client-fetched | Crawlers see weak H1/price/copy; slower first paint UX |
| P0 | No shared skeleton system; root uses `Loader` spinner | Generic “Curating elegance” spinner doesn’t match section layouts → CLS / weak perceived performance |
| P1 | Sitemap still uses seed `PRODUCTS` / `CATEGORIES` | New admin products missing from Google |
| P1 | Incomplete structured data (no Org / WebSite / Breadcrumbs) | Weaker rich results + entity understanding |
| P1 | Almost no ISR / `revalidate`; bridal `force-dynamic` | Slower TTFB; poor CDN cache on Cloudflare |
| P2 | No `next/dynamic` for drawers/modals/below-fold | Extra JS on every storefront page |
| P2 | SVG placeholder heroes; no R2 `remotePatterns` yet | Blocks real-photo optimization at go-live |
| P2 | `SITE.url` still placeholder | Wrong canonicals / OG / sitemap URLs |
| P3 | Thin internal links (no product breadcrumbs; footer misses `/bride`) | Weaker crawl paths |
| P3 | `lang="en"`; Arabic SEO / RTL later | Local Egypt discoverability incomplete |

### Existing loading UI (baseline)

| Location | Behavior |
| --- | --- |
| `src/app/loading.tsx` | Full-page branded `Loader` spinner |
| `ProductGrid` | Inline `animate-pulse` rectangles (8 cards) — **not** a reusable component |
| `ProductDetails` | Ad-hoc pulse blocks while React Query loads |
| Admin login | `Suspense` + `Loader` |

**Target:** one shared skeleton kit + route `loading.tsx` files that mirror each section’s layout.

---

## Workstreams

| ID | Workstream | Outcome |
| --- | --- | --- |
| **A** | Skeleton loaders (all sections) | Consistent, layout-preserving placeholders |
| **B** | Crawlable catalog HTML (RSC) | Product/shop content in first HTML |
| **C** | Sitemap & robots from live data | Accurate discovery |
| **D** | Structured data expansion | Org, WebSite, BreadcrumbList (+ hygiene) |
| **E** | Caching / ISR / CDN | Better TTFB on Workers |
| **F** | Code splitting & images | Leaner JS + R2-ready images |
| **G** | Internal links & SEO hygiene | Breadcrumbs, domain, keywords |

Suggested ship order: **A → B → C → D → E → F → G** (skeletons can land first without blocking SEO work; B/C deliver the biggest search gains).

---

## A. Skeleton loaders for all sections

### A.1 Why skeletons beat the full-page spinner

- The root `Loader` is elegant but **does not reserve the final layout** → when content appears, cards/hero jump into place (CLS risk) and users lose orientation.
- Skeletons show **where** content will land (hero, grid, product columns), improving perceived speed even if TTFB is unchanged.
- Route-level `loading.tsx` in App Router automatically wraps navigations in Suspense — skeletons fit that model; a centered spinner does not.

### A.2 Design rules (Zaya-specific)

1. **Shape matches the real section** — same grid columns, aspect ratios, and paddings as the finished UI.
2. **Brand tokens only** — `bg-brand-blush`, muted text bars; no purple / generic gray skeletons.
3. **Respect `prefers-reduced-motion`** — pulse/shimmer should reduce or stop (align with `globals.css` motion policy).
4. **No fake content** — no “Lorem”, no fake prices; abstract bars/blocks only.
5. **One kit, many compositions** — shared primitives; page sections compose them.
6. **Keep `Loader` for true full-app waits** — auth bootstrap, hard redirects; do not use it as the default for `/shop` or `/product`.
7. **WCAG** — skeletons are decorative; parent should have `aria-busy="true"` / `aria-live="polite"` where useful; don’t announce every pulse block.

### A.3 Shared component kit

Proposed location: `src/shared/components/ui/skeleton/` (barrel-export from `@/shared/components/ui`).

| Component | Role |
| --- | --- |
| `Skeleton` | Base block (`rounded`, optional `circle`, shimmer/pulse class) |
| `SkeletonText` | 1–N lines with varying widths |
| `SkeletonImage` | Aspect-ratio placeholder (`aspect-square`, `aspect-3/4`, hero) |
| `ProductCardSkeleton` | Card: image + 2 text lines + price bar |
| `ProductGridSkeleton` | Grid of `ProductCardSkeleton` (default 8; props for count / cols) |
| `ProductDetailSkeleton` | Gallery column + title/price/CTA column (desktop 2-col) |
| `HeroSkeleton` | Full-bleed hero plane (home / bridal) |
| `SectionHeaderSkeleton` | Eyebrow + heading + short subtitle |
| `CategoryPillsSkeleton` | Horizontal row of pill bars |
| `CartDrawerSkeleton` | Line items + totals (for drawer open/fetch) |
| `AccountListSkeleton` | Rows for orders / addresses / favorites |
| `FormSkeleton` | Label + input bars (checkout / bridal form / auth) |
| `BridalLandingSkeleton` | Hero + collection strips + CTA block |
| `TableSkeleton` | Admin tables (optional Phase A.6) |

Optional: add a subtle CSS shimmer utility in `globals.css` (e.g. `.skeleton-shimmer`) that disables under `prefers-reduced-motion`.

### A.4 Route-level `loading.tsx` map

Replace or augment the generic root spinner with **section-shaped** fallbacks:

| Route | `loading.tsx` content |
| --- | --- |
| `/` | `HeroSkeleton` + `SectionHeaderSkeleton` + `ProductGridSkeleton` (featured) |
| `/shop`, `/shop/[category]` | `CategoryPillsSkeleton` + header bars + `ProductGridSkeleton` |
| `/product/[id]` | `ProductDetailSkeleton` (+ optional related-grid skeleton below) |
| `/bride` | `BridalLandingSkeleton` |
| `/bride/custom` | `FormSkeleton` (+ short intro bars) |
| `/cart` | Cart line-item skeletons + summary panel |
| `/checkout` | `FormSkeleton` (address) + order-summary skeleton |
| `/account/*` | `AccountListSkeleton` / profile form skeleton per sub-route |
| `/order/[id]` | Status timeline bars + line items |
| Keep generic `app/loading.tsx` | Thin fallback only for uncaught routes (or remove fullscreen bias) |

Also add feature-level fallbacks where React Query still loads client islands:

| Component / area | Skeleton |
| --- | --- |
| `ProductGrid` | Use shared `ProductGridSkeleton` (remove duplicated inline pulse) |
| `ProductDetails` (while migrating to RSC) | `ProductDetailSkeleton` |
| `FeaturedProducts` / `RecentlyViewed` | `ProductGridSkeleton` (smaller count) |
| Search modal results | Compact grid / list skeleton |
| Cart drawer empty→fetch | `CartDrawerSkeleton` |
| Reviews block | Stars + text bar rows |
| Homepage builder blocks | Per-block skeleton if `homepage_builder` on |

### A.5 Implementation steps

1. Add base `Skeleton` + shimmer CSS (respect reduced motion).
2. Build composition components listed in A.3.
3. Refactor `ProductGrid` / `ProductDetails` to use shared skeletons.
4. Add route `loading.tsx` files per map above.
5. Soften root `app/loading.tsx` (prefer grid skeleton over fullscreen jewelry spinner, or keep spinner only for unknown routes).
6. Manual pass: soft-navigate between home → shop → product → bridal → cart and confirm **no large layout jump**.
7. Verify `aria-busy` on main content regions during pending states.

### A.6 Admin (optional same sprint)

Admin can keep `Loader` for mutations, but list pages benefit from `TableSkeleton` + form skeletons on `/admin/products/new` etc. Prioritize storefront first.

### A.7 Acceptance criteria (skeletons)

- [x] Shared skeleton primitives live under `shared/components/ui` and are the only pulse placeholders for product/shop/home.
- [x] Every primary storefront route has a layout-matching `loading.tsx` (or equivalent Suspense fallback).
- [x] Soft navigations show section skeletons, not only “Curating elegance”.
- [x] Pulse/shimmer respects `prefers-reduced-motion`.
- [ ] No CLS regression on hero / product grid / product detail (visual check + Lighthouse CLS).

---

## B. Crawlable catalog HTML (RSC)

### Problem

Product and shop UIs fetch via client React Query. Metadata/JSON-LD exist on the server, but **visible H1, price, description, and grid** may be missing from the first HTML document — weak for SEO and for users on slow networks.

### Target architecture

```
page.tsx (Server Component)
  ├─ fetch product / list (server service → D1)
  ├─ generateMetadata (already)
  ├─ JSON-LD (already / expand in D)
  └─ pass data as props → client islands
        ├─ ProductGallery (client)
        ├─ AddToBag / quantity (client)
        └─ ProductCard favorite toggle (client)
```

### Steps

1. **Product page**
   - Server-load product by id (existing `product.service`).
   - Render title, price, description, availability in RSC (or static shell with SEO-critical text).
   - Keep interactive bits as small `'use client'` children.
2. **Shop / category**
   - Server-load published product list for initial paint.
   - Client can still handle sort/filter if needed (or URL searchParams + RSC re-render).
3. **Hydration**
   - Prefer passing initial data into React Query (`initialData`) if client cache is still required — avoid double-fetch flashes.

### Acceptance

- [ ] View-source (or curl) of `/product/[id]` includes product name + price text.
- [ ] View-source of `/shop` and `/shop/[category]` includes product names (or at least grid links).
- [ ] Client interactivity (add to bag, favorites) still works.

---

## C. Sitemap & robots from live data

### Problem

`src/app/sitemap.ts` imports seed `CATEGORIES` / `PRODUCTS`. Admin-published catalog is invisible to crawlers.

### Steps

1. Query D1 (server) for **published** products and active categories.
2. Keep static entries: `/`, `/shop`, `/bride`, `/bride/custom`.
3. Add legal/marketing: `/about`, `/contact`, `/privacy`, `/terms`, `/cookies`.
4. Use real `lastModified` from DB when available.
5. Set sensible `changeFrequency` / `priority` (home/shop high; legal lower).
6. **Robots**
   - Disallow `/admin`, `/account`, `/auth`, `/cart`, `/checkout`, `/api` as appropriate.
   - Ensure production `SITE.url` is used (see G).
7. Optional: sitemap revalidation when products publish (tag-based or short ISR).

### Acceptance

- [ ] New published product appears in `/sitemap.xml` without code deploy of seed files.
- [ ] Draft/archived/hidden products are **not** listed.
- [ ] About/contact/legal URLs present.

---

## D. Structured data expansion

### Present

- Product + Offer + AggregateRating on product pages.

### Add

| Schema | Where | Notes |
| --- | --- | --- |
| `Organization` | Root layout | Name, logo, `url`, sameAs (Instagram etc. when ready) |
| `WebSite` | Root layout | Include `SearchAction` if site search URL is stable |
| `BreadcrumbList` | Product + category | Home → Shop → Category → Product |
| `ItemList` (optional) | Shop / category | List product URLs |
| `FAQPage` (optional) | Bridal landing | Only if real Q&A content exists |

### Hygiene

- Emit `AggregateRating` **only** when review count/rating are trustworthy (avoid thin/fake ratings).
- Fix product OG type if still generic `website` — prefer product-appropriate OG fields already partially wired via metadata.
- Align absolute URLs with production `SITE.url`.

### Acceptance

- [ ] Rich Results Test / Schema validator clean for Product + Breadcrumb + Organization.
- [ ] No AggregateRating without real reviews.

---

## E. Caching, ISR & rendering

### Principles

- Prefer **static / ISR** for marketing + catalog when personalization isn’t required.
- Use **SSR** only when session/admin/settings truly require request-time data.
- On Cloudflare (OpenNext), cacheability of the HTML response matters as much as image CDN.

### Steps

1. Catalog/home: set `export const revalidate = …` (e.g. 60–300s) or tag-based revalidation on publish.
2. Bridal pages: today `force-dynamic` for settings toggles — prefer caching **storefront config** with short TTL and static bridal shell when possible.
3. Avoid blocking the entire bridal/marketing page on every settings read if toggles change rarely.
4. Monitor TTFB in PageSpeed field data after deploy.

### Acceptance

- [ ] Home/shop/product HTML cacheable or ISR’d on production.
- [ ] Bridal TTFB improved or justified by measured toggle freshness needs.

---

## F. Code splitting & images

### JS / code splitting

Use `next/dynamic` (ssr: false only when needed) for:

- Search modal
- Cart drawer
- Reviews section
- Recently viewed
- Any homepage-builder heavy blocks

Keep header chrome light; defer non-critical panels until open/viewport.

### Images

1. When R2 uploads go live, add `images.remotePatterns` for the R2 / custom domain host in `next.config.ts`.
2. Replace SVG placeholder heroes with real photos; keep `priority` on LCP image only.
3. Retain accurate `sizes` on cards and grids after asset change.
4. Prefer WebP/AVIF via `next/image` defaults; avoid `dangerouslyAllowSVG` for untrusted sources.

### Acceptance

- [ ] Soft-nav to shop/product doesn’t download search/reviews JS until needed (verify via Network / bundle analyzer).
- [ ] Remote product images render through `next/image` in staging.

---

## G. Internal linking & SEO hygiene

1. Product breadcrumbs: Shop → Category → Product (UI + `BreadcrumbList`).
2. Footer: link `/bride` lander (not only `/bride/custom`).
3. Prefer live categories for footer links (D1), not seed-only.
4. Cut over `SITE.url` to the real domain before public indexing.
5. Wire `SITE.keywords` into root metadata where appropriate; plan Arabic/`lang`/hreflang with RTL roadmap.
6. Auth pages: `noindex` (defense in depth beyond robots disallow).

---

## Measurement

| Tool | When | What to watch |
| --- | --- | --- |
| Chrome Lighthouse (mobile) | Each PR that touches loading/HTML | LCP, CLS, INP, TBT |
| PageSpeed Insights + CrUX | After production deploy | Field LCP/CLS |
| Search Console | After sitemap go-live | Indexed pages, rich results, coverage |
| Rich Results Test | After JSON-LD changes | Product / Breadcrumb / Org |
| `@next/bundle-analyzer` | When adding dynamic import waves | Client bundle size |
| Manual crawl | After RSC product work | `curl` first HTML for H1/price |

Baseline before starting A/B; compare after each workstream.

---

## Suggested PR breakdown

| PR | Scope |
| --- | --- |
| **PR1 — Skeletons** | Shared kit + storefront `loading.tsx` + refactor ProductGrid/ProductDetails |
| **PR2 — RSC catalog HTML** | Product + shop server data → client islands |
| **PR3 — Sitemap/robots** | D1-backed sitemap + robots disallow + legal URLs |
| **PR4 — JSON-LD** | Organization, WebSite, BreadcrumbList + rating hygiene |
| **PR5 — Cache/ISR** | `revalidate` / config cache; bridal de-`force-dynamic` where safe |
| **PR6 — Dynamic + images** | `next/dynamic` panels; R2 `remotePatterns` |
| **PR7 — Links/hygiene** | Breadcrumbs UI, footer `/bride`, domain/keywords |

Each PR: `pnpm typecheck` · `pnpm lint` · `pnpm build` · `pnpm assert:no-secrets`.

---

## Explicitly out of scope (for now)

- Full Arabic RTL / hreflang (separate roadmap).
- Adding analytics/chat widgets (if added later: `next/script` + `lazyOnload` + consent).
- Rewriting admin to server components (storefront first).
- Replacing product photography (content ops; engineering only enables R2/`next/image`).

---

## Quick reference — original guide vs this plan

| Generic guide item | Zaya plan |
| --- | --- |
| Use `next/image` + priority | Already done → next: R2 patterns + real photos (F) |
| Dynamic imports | Not done → F |
| Server Components | Critical for product/shop → B |
| `next/font` | Done |
| SSG/ISR | Mostly missing → E |
| `next/script` | N/A until third parties |
| Meta / OG | Mostly done → expand carefully |
| Sitemap/robots | Exists but seed-based → C |
| JSON-LD Product | Done → expand Org/Breadcrumb (D) |
| Semantic HTML / Link | Mostly done → breadcrumbs (G) |
| *(missing from guide)* Skeleton loaders | **Workstream A — ship first for UX** |

---

## Decision log

| Date | Decision |
| --- | --- |
| 2026-07-15 | Plan authored; skeleton loaders are P0 alongside RSC crawlability |
| 2026-07-15 | Prefer section skeletons over fullscreen `Loader` for storefront navigations |
| 2026-07-15 | **Workstream A implemented** — shared kit under `src/shared/components/ui/skeleton/`, route `loading.tsx` for home/shop/product/bride/cart/checkout/account/order/auth, client refetch placeholders wired |
