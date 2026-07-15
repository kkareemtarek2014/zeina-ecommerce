# Psychology-Driven Styling & Components — Customer Conversion

> **Audience:** storefront shoppers only (Class A/B Egyptian women, 18–35).  
> **Goal:** use visual and interaction psychology so the customer *wants* to buy and feels safe doing it.  
> **Scope:** styling + UI components + **new customer features** (not ads, not admin).  
> **Related:** `BUSINESS-PLAN.md` §3b–§4 · feature flags in `src/config/features.config.ts` · tokens in `src/styles/tokens.css`.

This doc is the **how it should feel on the page**, plus **what to build next** when psychology needs a new feature (not only a CSS tweak). Prefer shipping against existing features (`product`, `cart`, `checkout`, `homepage`, `shop`) first; add new surface only when the lever needs it.

---

## 1. Core principles (keep these in mind)

| Principle | Customer feeling | Design rule |
| --- | --- | --- |
| **Clarity** | “I know what to do next” | One primary rose CTA per viewport |
| **Trust** | “This brand is real and safe” | Proof + payment/shipping facts near the buy action |
| **Desire** | “This looks like me / my vibe” | Lifestyle imagery, soft blush/gold hierarchy, not noise |
| **Urgency (honest)** | “I shouldn’t wait forever” | Scarcity/time only when true (low stock, real sale) |
| **Progress** | “I’m almost done” | Cart → checkout as a short, visible path |
| **Less friction** | “This won’t fail or surprise me” | Familiar patterns, mobile thumb-zone CTAs, clear COD |

Psychology ≠ dark patterns. Fake timers, fake “12 people viewing”, or invented stock hurt Class A/B trust and destroy repeat rate.

---

## 2. Psychological levers → Zaya styling map

### 2.1 Visual hierarchy (attention economics)

Customers decide in ~3 seconds what matters. Style must force a **reading order**:

1. Product / vibe image  
2. Price (or “from” price)  
3. Primary action (“Add to bag” / “Shop New In”)  
4. Soft proof (stars, “COD”, free-shipping hint)

**Styling**

- Headlines: `font-display` (Playfair) for emotion; body: `font-sans` (Jost) for orders/forms.  
- Primary CTA: `bg-brand-primary` → hover `brand-secondary`; one solid button only in the buy zone.  
- Gold (`brand-accent`) for **highlights only** (sale, bestseller badge) — never more accent than the rose CTA.  
- Muted text (`text-text-muted`) for meta; never compete with price or CTA.

**Avoid:** equal-weight buttons, purple “AI” gradients, dense pill clusters, multi-shadow cards that scream “dashboard”.

---

### 2.2 Anchoring (price feel)

People judge price relative to a reference, not in absolute EGP.

| Lever | Styling / component | Where |
| --- | --- | --- |
| Compare-at price | Strikethrough `text-text-muted` + current price larger and `text-text-primary` | Product card, ProductDetails |
| Charm pricing | Engine already rounds (195 / 245 / 295) — display bold, never bury | Price rows |
| Bundle / set framing | “Full look” secondary line under price | Product, cart recs |

**Rule:** if `compareAtPrice` exists, sale badge (`Badge tone="error"` or soft gold) sits **near the price**, not floating randomly on the image.

---

### 2.3 Loss aversion & goal gradient (free shipping)

Customers hate “missing” free shipping more than they love a small discount.

| Lever | Styling / component | Where |
| --- | --- | --- |
| Progress to free shipping | Thin rose progress bar + short copy: “X EGP left for free shipping” | Cart drawer / cart page (already started) |
| Unlocked state | Success green + check — celebratory, not loud | Cart |
| Threshold reminder | Announcement bar rotates free-shipping message | Homepage / global bar |

**Styling tip:** progress fill = `brand-primary`; track = `border` / blush. Keep height thin so it feels like a helper, not a billboard.

---

### 2.4 Social proof (bandwagon + authority)

People buy what others like when uncertain — accessories are style-uncertain.

| Lever | Styling / component | Where |
| --- | --- | --- |
| Stars + review count | Always adjacent to title/price (never only at page bottom) | ProductDetails |
| Review summary bars | Keep existing breakdown; increase contrast of filled vs empty | ProductReviews |
| UGC / Instagram | Real photos > stock; soft border, no heavy cards | Homepage social band |
| Best seller / New | Small gold or blush badge — one per card max | Product cards |

**Empty reviews:** don’t show a dead “0 reviews” hole. Soft line: “Be the first to review after your order” — still honest, still inviting.

---

### 2.5 Scarcity & urgency (only when true)

| Lever | When allowed | Styling |
| --- | --- | --- |
| Low stock | Qty ≤ `lowStockThreshold` from settings | Amber chip: “Only few left” near Add to bag |
| Real sale | `compareAtPrice` live | Red/soft-rose “Sale” badge |
| New drop | Recent published date / tag | Blush “New” badge |

**Forbidden:** countdown timers with no real end, fake viewer counts, perpetual “limited” on everything (scarcity loses power).

---

### 2.6 Commitment & consistency (micro-yes → buy)

Small yeses make the big yes easier.

| Step | Component feel |
| --- | --- |
| Favorite heart | Instant feedback (`animate-pop`); low commitment |
| Add to bag | Stronger feedback: button loading → success state / toast |
| Cart drawer opens | Soft overlay; focus on checkout CTA |
| Checkout | Same labels they already accepted in cart (items, shipping ETA) |

**Styling:** keep add-to-bag as the emotional peak (CSS animation only — no libraries). Checkout should feel calmer (form clarity > drama).

---

### 2.7 Cognitive load (decision fatigue)

Too many choices or fields = abandon.

| Place | Rule |
| --- | --- |
| Shop | Clear category pills + one sort; don’t stack filters on mobile |
| Product | Size/color first, then quantity, then one CTA |
| Checkout | Egyptian phone pattern obvious; governorate → zone fee preview clear |
| Forms | Real labels, errors under the field, rose focus ring — not red walls of text |

---

### 2.8 Trust & risk reduction (especially Egypt COD)

COD lowers payment fear but raises “will this store disappear?” fear.

Place **one compact trust strip** next to (or under) Add to bag / Place order:

- Cash on delivery available (when true)  
- Shipping ETA from settings (`shippingEtaLocal` / dropship)  
- Returns / WhatsApp help (contact from settings)

**Styling:** row of small icons + `text-xs text-text-secondary`, divider top — not a separate card cluttering the hero.

Order confirmation should feel like a receipt of safety: order id, timeline, WhatsApp path.

---

### 2.9 Aesthetic = premium = higher willingness to pay

Zaya’s rose / blush / cream / gold reads “feminine affordable luxury.” Protect that:

- Page background: soft `surface` cream, not cold white flat.  
- Sections: occasional `brand-blush` wash for story moments (bridal spotlight, social proof).  
- Imagery: product worn / held > empty product-on-grey.  
- Spacing: generous on mobile; avoid cramped grids that look cheap.  
- Motion: 2–3 intentional moments (add-to-bag, favorite, hero fade-up). Respect `prefers-reduced-motion`.

Cheap signals to avoid: harsh black borders, neon sale red everywhere, stock “FREE SHIPPING!!!” banners with multiple exclamation marks.

---

### 2.10 Peak–end rule (memory of the purchase)

Customers remember the **best moment** and the **ending**.

| Moment | Design |
| --- | --- |
| Peak | Unboxing promise in packaging copy; on site: satisfying add-to-bag + beautiful product gallery |
| End | Order confirmation calm, clear, on-brand; thank-you tone + “what happens next” |

Confirmation page should not look like an error screen (empty, gray, no next step). Offer: track order, continue shopping, WhatsApp.

---

## 3. Page-by-page playbook

### Homepage (`/`)

| Psychology | Do this |
| --- | --- |
| First impression | Brand + one seasonal headline + one primary CTA + dominant product visual |
| Curiosity | Collection vibe tiles (Korean / Coquette / Everyday) — emotion first, products second |
| Proof | Stars / review count / Instagram band mid-page |
| No dead end | Bottom CTA banner (“Shop New In”) |

**Styling:** full-bleed hero feel where design allows; no card clutter in first viewport; announcement bar for soft urgency (free shipping / COD / new drop).

### Shop (`/shop`, `/shop/[category]`)

| Psychology | Do this |
| --- | --- |
| Browse without overwhelm | Consistent card: image → name → price → soft badge |
| Desire | Hover/focus slight lift or image zoom (CSS only) |
| Anchoring | Compare-at on card when on sale |

### Product (`/product/[id]`)

| Psychology | Do this |
| --- | --- |
| Desire | Gallery first; sticky buy actions on mobile (thumb zone) |
| Trust | Stars + review count under title; shipping/COD strip under CTA |
| Anchoring | Price + compare-at + sale badge together |
| Scarcity | Low-stock chip only when true |

### Cart (`/cart`, drawer)

| Psychology | Do this |
| --- | --- |
| Goal gradient | Free-shipping progress always visible |
| Upsell without guilt | Recs framed as “Complete the look”, not “Buy more junk” |
| Path clarity | One dominant “Checkout” button |

### Checkout (`/checkout`)

| Psychology | Do this |
| --- | --- |
| Calm focus | Less decoration; clear sections: contact → address → payment |
| Risk reduction | Show order summary sticky/aside; COD explainer in plain Arabic/English as copy already uses |
| Friction | Validate phone early; show shipping cost update when governorate changes |

### Order confirmation (`/order/[id]`)

| Psychology | Do this |
| --- | --- |
| Relief | Success color + clear order number |
| Continuity | Timeline + ETA; link to account orders |
| Retention seed | Soft “save this look” / favorites / WhatsApp — don’t hard-sell discount immediately |

### Bridal (`/bride`)

| Psychology | Do this |
| --- | --- |
| Emotion > price | More blush/display typography; longer storytelling |
| Commitment | Custom request CTA as secondary path for high-intent brides |
| Premium | Fewer impulse badges; more curated stillness |

---

## 4. Component checklist (implement against these)

Use this when touching UI. Prefer existing shared components (`Button`, `Badge`, skeletons, toasts).

- [ ] **Primary CTA** — one rose solid button in the buy/checkout viewport  
- [ ] **Price block** — current + optional compare-at + optional sale badge  
- [ ] **Trust strip** — COD / ETA / help under Add to bag & Place order  
- [ ] **Free-shipping bar** — cart drawer + cart page; unlocked celebration state  
- [ ] **Social proof** — stars + count near title; reviews below fold  
- [ ] **Honest scarcity** — low stock chip only from real qty  
- [ ] **Mobile sticky buy bar** — product (and optionally cart): price + CTA  
- [ ] **Feedback micro-motion** — favorite pop, add-to-bag success (CSS only)  
- [ ] **Empty states** — coach next action (shop category / bestsellers), don’t feel broken  
- [ ] **Announcement bar** — rotate free shipping, COD, new drop (settings-driven)

---

## 5. Copy tone (psychology lives in words too)

| Instead of | Prefer |
| --- | --- |
| “Submit order” | “Place order” / “Confirm cash on delivery” |
| “Error” | Specific fix: “Use an Egyptian mobile number starting with 01…” |
| “Limited!!!!” | “Only a few left” (when true) |
| “Buy now” spam | “Add to bag” then “Checkout” (commitment ladder) |
| Vague shipping | Exact ETA strings from settings |

Keep bilingual/SEO Arabic keywords in meta; on-page UI can stay clear English or AR when RTL lands — psychology still applies.

---

## 6. What not to do (anti-patterns)

1. Fake urgency timers or fake live viewer counts.  
2. More than one accent color fighting the primary CTA.  
3. Card-wrapping everything (especially hero and trust lines).  
4. Hiding shipping cost until the last checkout step without preview.  
5. Aggressive popups on first visit (destroy Class A/B trust).  
6. Discount-first homepage (trains customers to never buy full price).  
7. Admin/ops chrome patterns on the storefront (dense tables, gray dashboards).

---

## 7. Priority implementation order

Highest leverage for **customers who will buy**:

1. **Product page buy zone** — price anchoring + trust strip + mobile sticky CTA + low-stock when true  
2. **Cart free-shipping progress** — polish copy + unlocked state + clear Checkout CTA  
3. **Homepage first viewport** — brand, one headline, one CTA, product-forward visual (per BUSINESS-PLAN §4)  
4. **Social proof placement** — stars near title; reviews section readable and inviting  
5. **Checkout calm + clarity** — shipping preview, phone help text, order summary always visible  
6. **Confirmation peak–end** — success framing + next steps  

---

## 8. How to measure (so psychology isn’t guesswork)

Instrument (or watch in analytics) these funnel rates:

| Step | Target direction |
| --- | --- |
| Visit → add to bag | Up |
| Add to bag → checkout start | Up |
| Checkout start → order | Up |
| AOV (vs free-shipping threshold) | Toward unlock without heavy discounting |
| Repeat rate | Protected by honest urgency + trust |

Change **one** major psychological UI surface at a time so you know what worked.

---

## 9. Quick reference — tokens that support persuasion

| Token | Role in conversion psychology |
| --- | --- |
| `--color-brand-primary` | Desire + action (CTAs) |
| `--color-brand-secondary` | Hover commitment (still the same action) |
| `--color-brand-accent` | Selective highlight (sale / premium badge) |
| `--color-brand-blush` | Soft emotional sections |
| `--color-surface` | Warm premium canvas |
| `--color-status-success` | Free shipping unlocked, order placed |
| `--color-status-warning` | Honest low stock |
| `--color-status-error` | Real sale / real form errors only |
| `--font-display` | Emotion, brand, bridal |
| `--font-sans` | Clarity for price, forms, shipping |

---

## 10. Psychology-based suggestions (do these)

Practical suggestions ranked by impact on **buy now**. Mix of styling, copy, and light feature work.

### A. Desire & desire → action

1. **One hero CTA rule** — every marketing viewport: one solid rose button. Secondary as text/outline.  
2. **Product cards sell lifestyle** — prefer model/worn shots; if only packshot, soft blush wash behind image so it never looks “marketplace grey.”  
3. **Add-to-bag as the peak** — button shows brief success state (“Added”) then drawer opens; use `animate-pop` / `animate-fade-up`.  
4. **“Complete the look” language** — cart/product recs: style framing, not “customers also bought” bureaucracy.  
5. **Bridal page = emotion budget** — more display type, slower scroll, fewer sale badges; everyday shop can be snappier.

### B. Price psychology

6. **Always pair compare-at + sale badge with the price** (not only on the image).  
7. **Show free-shipping gap in EGP** — “Add 180 EGP for free shipping” beats a bare percentage.  
8. **Charm prices stay visible** — never hide price behind “from” unless it’s a real bundle range.  
9. **Don’t train discount addiction** — homepage leads with new-in / vibe, not permanent “50% off” screams.  
10. **Bundle as value frame** — when `bundles` is on: “Save vs buying alone” next to set price (honest math).

### C. Trust & Egypt-specific risk

11. **Trust strip under every buy CTA** — COD · ETA · WhatsApp help (from settings).  
12. **Shipping cost before Place order** — update live when governorate changes (reduce last-step shock).  
13. **Order timeline as therapy** — confirmation + account orders: calm vertical steps, success color on current.  
14. **Reviews near the decision** — stars + count under title; empty state invites future review, doesn’t look broken.  
15. **WhatsApp as concierge** — floating or footer “Need help choosing?” for high-AOV / bridal (human = premium).

### D. Urgency without lying

16. **Low-stock chip only from real qty** — amber, near CTA, copy: “Only a few left.”  
17. **New badge for recent drops** — blush “New”; rotate off after N days so it stays meaningful.  
18. **Announcement bar rotate 3 honest messages** — free shipping · COD · new drop / bridal season.  
19. **Never fake live viewers or fake countdowns.**

### E. Less friction / more completion

20. **Mobile sticky buy bar** on product: price + Add to bag in thumb reach.  
21. **Checkout sections clearly labeled** — Contact → Address → Payment; one question at a time visually.  
22. **Phone field helper text** — Egyptian `01…` example under the input before error.  
23. **Guest-friendly path** — don’t force account before buy; offer “save order to account” after success.  
24. **Promo field collapsed by default** — “Have a code?” expander so the form doesn’t feel like a bargain hunt.

### F. Memory & return (so she buys again)

25. **Confirmation ends warm** — thank-you + what happens next + soft continue shopping.  
26. **Post-purchase review ask later** (feature below) — not on confirmation second 1.  
27. **Favorites synced after login** — preserve the “maybe” heart so desire isn’t lost.

---

## 11. New features to add (psychology → product)

Features that **don’t exist yet** (or sit behind flags / partial UI) where psychology clearly lifts conversion.  
Each row: **why it works** · **suggest build** · **flag / dependency** if any.

### Tier 1 — high conversion lift (build soon)

| Feature | Psychology | What to build | Notes |
| --- | --- | --- | --- |
| **Storefront review submit** | Effort justification + social proof flywheel | After delivery, soft prompt to rate/photos → existing review create API | API exists; UI missing |
| **Low-stock / back-in-stock waitlist** | Scarcity + fear of missing out (honest) | “Notify me” email/WhatsApp when qty = 0; show waitlist only when OOS | Pairs with honest scarcity |
| **“X EGP to free shipping” recs** | Goal gradient + loss aversion | Cart suggests 1–2 cheap add-ons that close the gap to 1,500 EGP | Extends current progress bar |
| **Size / color “help me choose”** | Decision fatigue reduction | Tiny quiz or WhatsApp deep-link on product (“Not sure? Ask us”) | Bridal + jewelry first |
| **Order tracking share / WhatsApp status** | Trust + peak–end | One-tap “message us about this order” with order id prefilled | Uses contact settings |
| **Exit-intent / abandon cart soft save** | Loss aversion (gentle) | Guest: “Save bag for later?” via WhatsApp/SMS link — **once**, dismissible, no fake timer | Never aggressive popup wall |

### Tier 2 — turn on or finish existing flags

| Feature | Psychology | What to build | Flag / status |
| --- | --- | --- | --- |
| **Bundles (“Buy look / Buy 2”)** | Anchoring + perceived value | Bundle PDP + cart line “you save Z EGP” | `bundles` (default OFF) |
| **Pre-orders with clear ETA** | Commitment under scarcity | OOS bestsellers stay buyable; badge “Ships in 2–3 weeks” | `preorders` (default OFF) |
| **Social proof band (live)** | Bandwagon | Homepage/product: real recent buys count **only if accurate**; else ratings + UGC | `social_proof` (default OFF) — no fake counters |
| **Online pay (card/wallet)** | Choice + control for non-COD shoppers | Keep COD primary; card as optional trust for Class A | `online_payments` + Paymob |
| **Wallet credit / refunds** | Endowment + lock-in | Refund-to-wallet keeps money “hers” in-store | `wallet` (default OFF) |
| **Referral / friend code at confirmation** | Reciprocity + social proof | “Give 10% · get 10%” after order — thank-you card digital twin | Promo engine exists |

### Tier 3 — deeper psychology features (roadmap)

| Feature | Psychology | What to build | Caution |
| --- | --- | --- | --- |
| **Wishlist → drop alert** | Consistency (she already loved it) | When favorited item goes on sale or restocks → notify | Permission-based, not spam |
| **Recently viewed rail** | Mere exposure / familiarity | Soft “Seen recently” on home/cart — already partial client store | Don’t look stalker-y |
| **Lookbooks / shop-the-vibe pages** | Identity + aspiration | Curated multi-product stories with one CTA | Homepage tiles can link here |
| **Gift mode at checkout** | Reciprocity / occasion buying | “This is a gift” → note + hide prices on packing slip intent | Bridal / Ramadan / Mother’s day |
| **VIP early access to drops** | Scarcity + status | WhatsApp list of top buyers sees New 24h early | Manual VIP first (BUSINESS-PLAN) |
| **Photo reviews / UGC gallery** | Bandwagon + trust | Review photos on PDP; “As worn by customers” | Moderate for quality |
| **Arabic RTL storefront** | Fluency / ease | Less cognitive load for AR-first shoppers | Big project; huge trust win |
| **Try-before styles (virtual try / size charts)** | Risk reduction | Charts + face/jewelry proportion tips | Especially sunglasses, earrings |
| **Post-purchase “how to style” content** | Peak–end + retention | Order page link to 15s Reel or tip card | Feeds UGC loop |
| **Loyalty stamps / after N orders** | Goal gradient | “2 more orders → surprise gift” progress | Keep aesthetic premium, not arcade |

### Features to skip (psychology says no)

| Idea | Why it hurts |
| --- | --- |
| Fake “12 people viewing” | Detected as manipulative; kills Class A/B trust |
| Permanent homepage countdown | Habituation; looks desperate |
| Forced login before cart | Raises friction more than it raises AOV |
| Auto-apply huge discounts every visit | Anchors her to wait for sales |
| Chat widgets that interrupt scroll | Anxiety > help unless concierge-quality |

---

## 12. Suggestion → feature matrix (quick pick)

Use when prioritizing a sprint: pick **one psychology goal**, ship the matching suggestion or feature.

| If you want… | Start with suggestion (§10) | Or build feature (§11) |
| --- | --- | --- |
| More add-to-bags | Sticky buy bar, CTA hierarchy, add success motion | Help-me-choose / WhatsApp on PDP |
| Higher AOV | Free-shipping progress copy | Gap-closing cart recs; bundles |
| More checkout completes | Trust strip, shipping preview, phone helper | Soft bag save for abandoners |
| More trust | Stars near title, COD/ETA strip | Photo reviews; review submit after delivery |
| More urgency (honest) | Low-stock chip, New badge, announcement bar | Waitlist + preorders with real ETA |
| More repeats | Warm confirmation ending | Referral code; wishlist alerts; wallet |

---

## 13. Suggested build sequence (psychology roadmap)

1. **Polish existing buy path** — §7 priorities (styling + trust strip + sticky CTA + free-shipping copy).  
2. **Cart gap closer** — recommend products that reach free shipping.  
3. **Review submit + photo reviews** — proof flywheel.  
4. **Enable bundles** (flag) with clear “you save” framing.  
5. **Pre-orders + waitlist** for sold-out desire.  
6. **Referral on confirmation** + digital thank-you.  
7. **WhatsApp concierge** sticky for bridal / high-ticket.  
8. **Wallet + soft loyalty** when retention is the KPI.

Ship and measure (§8) after each step before stacking the next.

---

*When implementing, prefer editing existing feature components under `src/features/{homepage,shop,product,cart,checkout,order}/` and shared UI primitives — keep psychology in styling and component behavior first; add new features from §11 only when styling alone cannot carry the lever.*
