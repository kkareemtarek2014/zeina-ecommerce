# Homepage Improvement — Suggestions & Tasks

> Goal: turn the homepage from "nice brochure" into a **buying machine** for impulse-price
> squishies, tuned for Instagram/TikTok traffic (video-native, mobile, COD).
> Aligned with `BUSINESS-PLAN.md` §3 (CRO) and §4 (acquisition), `CLAUDE.md` rules
> (tokens only, CSS-only animations, honest claims — no fake scarcity, no medical claims).
>
> Current state (`src/features/homepage/components/ClassicHome.tsx`): hero (static SVG) →
> categories → trust band → education band → vibes → featured products → free-shipping band →
> recently viewed → social proof (flag OFF) → final CTA → SEO strip.

---

## The 6 suggestions (priority order)

| # | Suggestion | Why it makes people buy |
| --- | --- | --- |
| S1 | **Shorten the path to product** — move Best Squishies up, add quick "Add to bag" + price anchors ("From 79 EGP") | IG/TikTok visitors decide in seconds; products must be buyable within one scroll, at a visibly cheap price |
| S2 | **Make the 20% offer impossible to miss** — FIRST20 claim strip + rotating announcement bar | The ad promised 20% off; the homepage must confirm it instantly or the visitor bounces |
| S3 | **Mystery Box / bundle spotlight section** | Highest-AOV lever in the business plan; bundles flag is already ON but invisible on home |
| S4 | **Hero that squishes** — looping squish video + monthly-drop countdown | Video-native audience; a static SVG kills the "satisfying" hook that brought them |
| S5 | **Real social proof** — live rating strip from the reviews API + honest-copy cleanup | Trust is the #1 COD objection killer; fake-sounding claims ("thousands of squeezers") hurt it |
| S6 | **Accurate free-shipping threshold from DB** + WhatsApp "help me pick a gift" | Wrong threshold (code still 1,500 vs 500 target) suppresses the strongest AOV nudge |

Recommended build order: **S2 → S1 → S6 → S3 → S5 → S4** (S2/S1/S6 are small and land the
campaign; S3 adds AOV; S5/S4 need content/assets).

---

## S1 — Shorten the path to product

**New section order:** hero → FIRST20 strip → Best Squishies (featured) → Shop by Size →
Mystery Box spotlight (S3) → trust band → education band → vibes → free-shipping band →
recently viewed → social proof → final CTA → SEO strip.

- [ ] **1.1 Reorder sections in `ClassicHome.tsx`**
  - Move the `FeaturedProducts` section directly under the hero (before Categories).
  - Keep every section ending in a CTA (rule from BUSINESS-PLAN §3.6).
- [ ] **1.2 Quick add-to-bag on product cards**
  - In `src/features/shop/components/ProductCard.tsx` (used by `FeaturedProducts`): add a
    compact "Add to bag" button (bag icon + label, `aria-label`) that calls the existing
    cart store `addItem` — no navigation. Show `animate-pop` + brief "Added ✓" state.
  - Only for in-stock, non-bundle products; otherwise link to product page as today.
  - Gate any cart-count-dependent render behind `useHydrated()` (rule 6).
- [ ] **1.3 Price anchors on tiles**
  - Category tiles + vibe cards: add a small `From {minPrice} EGP` chip
    (`bg-surface-raised`, `text-brand-primary`, rounded-full).
  - Min price per category: extend the existing categories/home data fetch — compute
    server-side in `listCategories` consumer or a tiny addition to the home page RSC using
    the product service (published products only, sell price only — never `basePrice`).
  - If a category has no products, hide the chip (no hardcoded prices).
- [ ] **1.4 Verify** — hero → first buyable product within ~1.5 viewport heights on 375px;
  add-to-bag works without hydration warnings.

## S2 — Make the 20% offer impossible to miss

- [ ] **2.1 FIRST20 claim strip under the hero**
  - New `WelcomeOfferStrip.tsx` in `src/features/welcome-offer/components/` (reuses
    `WELCOME_OFFER` config — code/percent stay single-source).
  - Slim band: "🫧 First order? Take {percent}% off with code **{code}**" + copy button
    (same clipboard pattern as the popup) + "Shop now" link. `bg-brand-blush`, dashed
    teal code box, `animate-fade-up`.
  - Always visible (unlike the popup, which shows once) — this is the landing confirmation
    for the IG/TikTok ad. Hidden when `promo_code` feature flag is off.
  - Export via the feature barrel; render in `ClassicHome` directly under the hero.
- [ ] **2.2 Rotating announcement bar content**
  - `AnnouncementBar` is settings-driven (`src/shared/components/layout/AnnouncementBar.tsx`).
    If it supports one message only: add rotation — accept an array, cycle with a CSS-only
    fade (keyframes in `globals.css`, respect `prefers-reduced-motion` via the global rule).
  - Messages (admin-editable via settings; seed defaults): "20% off your first order —
    code FIRST20" · "Free shipping over {threshold} EGP" · "COD — pay when it arrives" ·
    "New drop every month".
- [ ] **2.3 Verify** — landing from a `?utm_source=instagram` link shows code within 1s;
  copy works on iOS Safari (clipboard fallback: select-on-tap).

## S3 — Mystery Box / bundle spotlight

- [ ] **3.1 Spotlight section component**
  - New `BundleSpotlight.tsx` in `features/homepage/components/`: full-width premium moment
    (BUSINESS-PLAN §3.5). Apricot-tinted gradient card, product image, name, price,
    "What's inside: 4 surprise squishies" copy, single CTA "Get the Mystery Box".
  - Data: fetch the featured bundle server-side (RSC) via the existing bundles/product
    service — pick by tag `mystery` or first published bundle; pass as prop from
    `app/page.tsx`. Render nothing if none published or `bundles` flag off
    (`isFeatureEnabled('bundles')`).
- [ ] **3.2 "3 for 399"-style bundle row** *(optional, if ≥2 bundles published)*
  - Under the spotlight: 2–3 bundle cards reusing `ProductCard` with a small
    "Bundle · Save X EGP" apricot badge (computed from bundle vs sum of items server-side —
    only if that data is already in the DTO; otherwise omit the savings number).
- [ ] **3.3 Verify** — flag off ⇒ section absent; no layout shift (reserve nothing).

## S4 — Hero that squishes

- [ ] **4.1 Squish video in hero**
  - Replace the static `hero.svg` `<Image>` with `<video autoPlay muted loop playsInline>`
    (poster = current image) using a short (~3–5s, <1.5 MB) squish-and-release loop.
    Asset: `public/videos/hero-squish.mp4` (webm + mp4 sources) — **needs a real filming
    session; until the file exists, keep the image fallback** (render video only when the
    asset is configured in settings or a constant flag in the component).
  - `prefers-reduced-motion`: render the poster image instead (CSS `@media` on a wrapper +
    conditional render — no JS animation libs).
  - Keep `priority`/LCP in mind: poster loads first; video lazy via `preload="none"`.
- [ ] **4.2 Monthly drop countdown chip** *(honest urgency)*
  - Small chip in the hero ("Next drop: {n} days") counting to a `next_drop_date` value
    from settings (admin-editable; add to a settings sub-page or reuse an existing generic
    field). Client component gated on `useHydrated()`; hidden when no date set or date past.
  - No fake stock scarcity anywhere — countdown reflects a real drop date only.
- [ ] **4.3 Verify** — LCP unchanged or better (test `pnpm build` + Lighthouse mobile);
  reduced-motion shows static poster.

## S5 — Real social proof + honest copy

- [ ] **5.1 Live rating strip**
  - Small band under Best Squishies: "★ {avg} from {count} reviews" computed from the
    existing reviews API — add a tiny aggregate endpoint OR compute in RSC via the review
    service (prefer service call in `app/page.tsx`, pass as prop). Render nothing below a
    minimum (e.g. <5 reviews) — never fake it.
- [ ] **5.2 UGC wall stays behind `social_proof` flag**
  - `SocialProofSection` unchanged; flip the flag only when real Instagram content exists.
- [ ] **5.3 Honest-copy cleanup in `SeoStrip` + hero**
  - Remove/replace unverifiable claims: "Join thousands of happy squeezers" (until true),
    "free sticker and calm-ritual card" (only if actually packed). Keep keywords intact
    (SEO rules in CLAUDE.md — سكويشي, squishy toys Egypt, etc.).
- [ ] **5.4 Verify** — no rating strip renders with zero reviews; SEO keywords still present
  in page HTML.

## S6 — Accurate threshold + gift concierge

- [ ] **6.1 Free-shipping band reads the DB threshold**
  - `ClassicHome` currently renders static `FREE_SHIPPING_THRESHOLD` (code value 1,500 —
    wrong vs the 500 EGP target). Fetch via `GET /api/storefront-config` pattern: pass the
    threshold from the RSC (`app/page.tsx`, via the same server service checkout uses) into
    `ClassicHome` as a prop; fall back to the constant if unavailable.
  - Same fix for the threshold mention inside `SeoStrip` and announcement bar (S2.2).
- [ ] **6.2 WhatsApp "help me pick a gift"**
  - Small link near the trust band / final CTA: "🎁 Need a gift? Chat with us" →
    existing WhatsApp link helper (`normalizeWhatsAppDigits` + branding number, already
    plumbed through `StorefrontChrome`) with a prefilled text ("I need help picking a gift").
    Pass `branding.whatsappNumber` down or read from the same branding prop chain.
- [ ] **6.3 Verify** — threshold on home matches checkout preview; WhatsApp opens with
  prefilled message on mobile.

---

## Cross-cutting rules for every task

- Server-fetch data in `app/page.tsx` (RSC) and pass props — components never call repos
  directly; client bits only where interaction demands it (quick-add, copy, countdown).
- No `basePrice`/cost fields in anything rendered (`pnpm assert:no-secrets`).
- All colors/radii from tokens; animations CSS-only; `aria-label` on icon buttons.
- Every new section: mobile-first, ends in a CTA, no layout shift when its data is absent.
- After each suggestion lands: `pnpm build && pnpm typecheck && pnpm lint &&
  pnpm assert:no-secrets` + Lighthouse mobile spot-check (homepage is the LCP-critical page —
  see `docs/performance-seo-plan.md`).

## Measurement (know it worked)

- Track add-to-cart rate from homepage sessions (target ≥ 8% per BUSINESS-PLAN §3) and
  FIRST20 redemptions per order (promo redemptions table already exists).
- Watch AOV before/after S3 (bundle spotlight) — target upward drift toward the 500 EGP
  free-shipping threshold.
