# Conversion Psychology — Task Backlog

> Source: `psychology-conversion-styling.md` audit (2026-07-15).
> Status legend: `[ ]` todo · `[x]` done. Ship one sprint, verify (`pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets`), measure funnel (§8 of psych doc), then next sprint.

## Already live (no work needed)

Stars + review count near title · compare-at strikethrough + Sale badge at price ·
trust strip under Add to bag (COD / free shipping / quality) · add-to-bag success state ·
cart free-shipping message + unlocked celebration · cart recommendations ·
announcement bar (settings-driven) · live shipping preview on governorate change ·
order status timeline + continue shopping · WhatsApp button · preorder ETA copy.

---

## Sprint 1 — client-only, no contract changes (impact: add-to-bag ↑, AOV ↑)

### 1. Mobile sticky buy bar (product page) — effort S, impact HIGH
- [x] New `StickyBuyBar.tsx` in `src/features/product/components/`
- [x] Fixed bottom bar, mobile only: price + Add to bag (reuses `handleAdd` state from `ProductDetails.tsx`)
- [x] Show when main Add-to-bag button leaves viewport (IntersectionObserver on the button)
- [x] CSS-only slide-up (`animate-fade-up`), respect `prefers-reduced-motion`
- [x] Same disabled/preorder/sold-out logic as main button

**Psychology:** thumb-zone CTA; the buy action never scrolls away. Egypt traffic is mobile-first.

### 2. Free-shipping progress bar (cart) — effort S, impact HIGH
- [x] Thin rose progress bar above the "Add X EGP for free shipping" text
- [x] `CartDrawer.tsx` (~line 136) and `CartView.tsx`
- [x] Fill = `brand-primary`, track = blush/border; unlocked → full bar in `status-success` + check
- [x] Keep height thin (helper, not billboard)

**Psychology:** goal gradient — a visual bar converts far better than text alone.

### 3. Gap-closing cart recommendations — effort S–M, impact HIGH (AOV)
- [x] In `useCartRecommendations`: accept `remainingForFree`; when gap is 0–300 EGP prefer items priced ≤ gap
- [x] Retitle section when gap-aware: "Add {X} EGP for free shipping — complete with:"
- [x] Rename default title "You may also like" → "Complete the look" (`CartRecommendations.tsx:20`)

**Psychology:** loss aversion + goal gradient; frames upsell as style, not "buy more".

### 4. Small S-size wins
- [x] Collapse coupon input behind "Have a code?" expander (`CartDrawer.tsx:147`) — open field invites discount-hunting mid-checkout
- [x] Phone helper text "Egyptian mobile starting 01…" under the field *before* error (`CheckoutForm.tsx:~151`)
- [x] Reviews empty state copy: "No reviews yet" → "Be the first to review after your order" (`ProductReviews.tsx:44,61`)

---

## Sprint 2 — needs server/DTO work

### 5. Honest low-stock chip — effort M, impact HIGH
- [x] Add server-derived `lowStock: boolean` to storefront product DTO (qty ≤ `lowStockThreshold` from settings)
- [x] `src/shared/contracts/product.contract.ts` + product mapper — **never expose raw qty** (`pnpm assert:no-secrets`)
- [x] Amber chip "Only a few left" near Add to bag in `ProductDetails.tsx` (tone: `status-warning`)
- [x] Only render when true — no fake scarcity, ever

**Psychology:** honest scarcity near the CTA; loses power if faked or permanent.

### 6. Storefront review submit — effort M–L, impact HIGH (proof flywheel)
- [x] Review create API already exists (auth) — build the missing UI
- [x] "Rate your order" prompt on **delivered** orders in `/account/orders` (not on confirmation second 1)
- [x] Simple form: stars + text (+ photo later); RHF + Zod like other forms
- [x] More reviews → stronger social proof near title → higher conversion

---

## Sprint 3 — flags & features (from psych doc §11 Tier 1–2)

- [x] **Back-in-stock waitlist** — "Notify me" when OOS (email); pairs with honest scarcity
- [x] **Bundles** — flip `bundles` flag; "you save Z EGP" framing (anchoring)
- [x] **Referral code on confirmation** — fixed shared `ZAYFRIEND10`
- [x] **WhatsApp concierge on PDP** — inline CTA for bridal + jewelry
- [x] **Wishlist drop/restock alerts** — auth-gated toggles on PDP + favorites

---

## Never do (anti-patterns)

Fake timers · fake viewer counts · forced login before cart · permanent countdown ·
discount-first homepage · aggressive first-visit popups.

## Measure after each sprint

| Metric | Direction |
| --- | --- |
| Visit → add to bag | ↑ (sprint 1: sticky bar) |
| Add to bag → checkout start | ↑ |
| AOV vs 1,500 EGP threshold | ↑ (progress bar + gap recs) |
| Checkout start → order | ↑ (phone helper) |
| Repeat rate | protected (honest scarcity, reviews) |

Change one major surface at a time so you know what worked.
