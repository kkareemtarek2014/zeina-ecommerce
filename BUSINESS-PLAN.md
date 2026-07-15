# Zaya (زينة) — Business Plan v2

> Improved edition — focused on **more sales, more customers, higher repeat rate**.
> Every tactic below maps to a feature that already exists in the platform (or is being built),
> so the plan is executable, not theoretical.

---

## 1. Executive Summary

**Vision:** Egypt's most exciting destination for trendy accessories — evolving from a curated
reseller into a private-label lifestyle brand.

**One-liner:** *"Affordable luxury, delivered — curated accessories for the modern Egyptian woman."*

**The edge (vs. Instagram shops):**

1. **A real platform, not a DM funnel** — custom Next.js storefront with search, reviews,
   order tracking, and card/wallet payments. Buying takes 90 seconds, not a 2-hour DM conversation.
2. **Landed-cost pricing engine** — margins survive EGP volatility automatically (live FX +
   customs + VAT + handling → 50% target margin, rounded to 5 EGP).
3. **Two-brand architecture in one store** — trendy everyday line (impulse, 150–350 EGP) +
   premium bridal/custom line (milestone, 600–1,500+ EGP). Bridal customers become everyday
   customers and vice versa.

**Target audience:** Women 18–35, Class A/B, urban Egypt (Cairo, Giza, Alexandria, North Coast
seasonal). Fashion-aware, follows Korean/coquette trends, values convenience and premium feel,
but is price-conscious in EGP terms.

**Month-12 goals:** 300 orders/month · repeat rate > 25% · AOV ≥ 550 EGP · bridal/custom ≥ 15%
of revenue (path to 25–35% by year 3).

---

## 2. What Was Missing in v1 (and what this version fixes)

| Gap in v1 | Fix in v2 |
| --- | --- |
| No conversion plan — traffic was the whole story | §4: full CRO plan (homepage redesign, CTAs, urgency, trust) |
| No retention engine — every sale was a new sale | §6: repeat-purchase system (WhatsApp flows, win-back promos, wallet credit) |
| No referral/UGC loop — paid ads carried all acquisition | §5: referral codes + unboxing-driven UGC engine |
| Bridal was a category, not a funnel | §7: dedicated /bride landing page + lead capture + partnership channel |
| No numbers — "growth" without unit economics | §8: unit economics + KPI dashboard |
| No sequencing — everything at once | §9: 90-day execution roadmap |

---

## 3. Product & Sourcing — Micro-Warehousing (unchanged core, sharper rules)

- **Phase 1 (now):** Temu/Shein-style suppliers for low-risk trend testing. Import in small
  bulk, hold locally, repackage in Zaya-branded boxes, ship via Bosta.
- **Phase 2 (month 6+):** winners (>10 units/month for 2 consecutive months) move to 1688 /
  direct manufacturers at 40–60% lower unit cost → same sell price, double margin.
- **Curation rule:** max 30–40 live products per collection. Scarcity is a feature —
  "sold out" builds trust that items are real and wanted (pre-orders capture the demand anyway).
- **Collections, not catalog:** Summer, Korean, Coquette, Everyday Essentials, Bridal.
  Every collection gets a homepage moment and an Instagram content batch.
- **The unboxing IS the ad:** branded box + tissue + thank-you card with **referral code** +
  care card. Target: 1 in 10 customers posts a story. That's the cheapest acquisition channel
  in this plan.

## 3b. Pricing — Landed-Cost Engine (already live in the platform)

- **Formula:** (USD base × live FX) + bulk shipping (~$2) + customs (10.5%) + VAT (14%) +
  handling (~100 EGP) → × 1.5 target margin → round up to 5 EGP.
- FX refreshes daily (cron); reprice runs automatically; all cost inputs stay server-side.
- **Psychological pricing rules on top of the engine:**
  - Anchor with `compareAtPrice` ("was 450 → now 350") on featured items.
  - Keep hero products just under thresholds: 195, 245, 295 EGP.
  - Free-shipping threshold (1,500 EGP) is an AOV tool: show "add X EGP for free shipping"
    progress in the cart.

---

## 4. Website Conversion Plan (CRO) — turn visitors into buyers

The platform's trust features already exist (reviews with breakdown bars, vertical order
timeline, Paymob card/wallet, COD). What was missing is **excitement and urgency at the top of
the funnel.** The homepage redesign delivers:

1. **Hero that sells in 3 seconds** — bold seasonal statement, product-forward visual, and TWO
   clear CTAs: *Shop New In* (primary) and *Best Sellers* (secondary). No dead space.
2. **Announcement bar** — rotating: "Free shipping over 1,500 EGP" · "COD available" ·
   "New drop every week". Constant low-key urgency.
3. **Shop-the-vibe collection tiles** — Korean Minimal / Coquette / Everyday Gold — trend
   language Class A/B customers recognize from TikTok, one tap from purchase intent.
4. **Social proof band** — ratings, review counts, Instagram feed section (already built).
5. **Bridal spotlight** — a premium, visually distinct section funneling to /bride (§7).
6. **Bottom-of-page CTA banner** — never let the page end without an action.
7. **Every section has a CTA.** Rule: no scroll-depth without a tappable next step.

**Conversion targets:** visitor → add-to-cart ≥ 6% · cart → checkout ≥ 40% · checkout →
order ≥ 65%. Instrument with Meta Pixel + Conversion API events at each step.

**AOV levers (features already built, switch them on):**
- **Bundles:** "Buy 2 Get 1" on hair + jewelry (highest-margin, lowest-shipping-weight).
- **Pre-orders:** OOS bestsellers stay sellable with explicit 2–3 week ETA.
- **Cart recommendations** + free-shipping progress bar.

---

## 5. Customer Acquisition — the "Parallel Economies" playbook

**Economic segmentation (kept from v1 — it's right):**
- **North Coast / aspiration tier:** creators + influencers for cultural signaling. Their job
  is not direct sales — it's making the brand feel expensive.
- **In-city majority:** value-led messaging, promos, late-night ad scheduling. This is where
  volume comes from.

**Channel plan, in priority order:**

1. **Instagram Reels + TikTok (organic), video-first.** 4–5 reels/week: "How to style",
   packing orders (ASMR unboxing), trend reactions with Egyptian rap audio, before/after
   outfit lifts. Every reel ends with a spoken CTA + link sticker.
2. **UGC / referral loop.** Thank-you card in every box: "Post your unboxing, tag @zaya,
   get 10% off your next order — your friends get 10% too." (Promo-code engine already
   supports this. Track referral codes per customer.)
3. **Micro-influencer seeding (5k–50k followers).** 10 gift boxes/month to Cairo/Alex fashion
   micro-creators. Pay-per-post only after a creator's first organic post converts.
4. **Paid ads (Meta), funnel structure:**
   - *Top:* Reels ads, 18–35 W, Class A/B interests (fashion, K-culture, jewelry), goal =
     landing page views. Budget weighted to 9 PM–1 AM.
   - *Middle:* catalog ads (dynamic product ads) to site visitors.
   - *Bottom:* Conversion-API retargeting of add-to-cart non-buyers with a 24-hour
     "still thinking about it?" creative + free-shipping nudge.
   - Starting budget: 300–500 EGP/day; scale only what hits CPA ≤ 120 EGP.
5. **WhatsApp as a sales channel** (Class A/B expects it): order confirmations, shipping
   updates, and a "need help choosing?" concierge line. Human + fast = premium feel.

---

## 6. Retention — where the profit actually is

A repeat customer costs ~0 EGP to acquire. Target: >25% repeat rate by month 12.

- **Post-purchase flow (WhatsApp/SMS):** D0 confirmation → D2 shipped + tracking link →
  D7 "how do you like it?" + review ask → D21 10% off next order (personal promo code).
- **Win-back:** 60 days inactive → "we miss you" + curated new-in picks.
- **Wallet credit (feature exists, flag off):** turn on when refunds/returns start — instant
  refund-to-wallet beats bank refunds and keeps money in the store.
- **VIP tier (manual at first):** top 50 customers get early access to drops via WhatsApp
  broadcast + occasional free gift in box. Class A/B loves access more than discounts.
- **Review engine:** every delivered order triggers a review request; reviews with photos get
  a bonus promo code. (Review-create API exists; add storefront submit UI — roadmap.)

---

## 7. Bridal & Custom — the premium engine

**Why it matters:** AOV 600–1,500+ EGP vs 250 EGP everyday; emotional purchase = price
insensitivity; weddings are year-round in Egypt with summer/autumn peaks.

**The funnel (being built now):**
1. **Dedicated /bride landing page** — luxury look, separate from the everyday shop:
   bridal collections (tiaras, veils, hair, jewelry, robes, gift boxes), personalization
   showcase (names, dates, engraving), and a prominent **custom-request CTA** (photo/video
   upload → reply within 2 days — already built at /bride/custom).
2. **Admin toggle** — bridal page can be turned on/off from the dashboard (seasonal control,
   or while stock/partners are not ready).
3. **Lead capture, not just sales:** brides plan for months. The custom-request form is a
   lead pipeline — follow up via WhatsApp with mood boards and bundle quotes.

**Products:** bridal hair (clips, combs, crowns, pearls) · jewelry sets · veils & robes ·
bridesmaid gift boxes · welcome boxes · keepsakes · personalized (name necklaces, initial
bracelets, engraved boxes, custom hangers, proposal boxes).

**Asset-light custom model:** partner with local laser-engraving, UV-printing, and handmade
artisans. Zaya owns brand, packaging, and customer relationship; partners own production.
Select partners on quality, speed, consistency; always keep 2 partners per capability.

**Partnership channel (new):** wedding photographers, planners, and dress ateliers get a
10% referral commission code. One planner = dozens of brides/year.

**Pricing:** standard 150–250 · personalized 250–600 · bridal boxes 600–1,500 · premium sets
1,500+. Customization fees priced per complexity.

**Goal:** bridal + custom = 15% of revenue by month 12, 25–35% by year 3.

---

## 8. Unit Economics & KPIs

**Example everyday order (validate against real data monthly):**

| Line | EGP |
| --- | --- |
| AOV (2 items) | 550 |
| Landed cost of goods | ~245 |
| Packaging (branded box) | ~25 |
| Bosta shipping (blended) | ~70 (partly passed to customer) |
| Payment fees (Paymob ~2.75% when card) | ~15 |
| Marketing (blended CPA ÷ orders) | ~110 |
| **Contribution profit** | **~85–150 / order** |

Bridal orders: 2–4× the contribution per order — this is why §7 is the margin engine.

**Weekly KPI dashboard (admin stats already exist — add these):**
sessions → CVR → orders · AOV · CPA by channel · repeat rate · bridal % of revenue ·
COD refusal rate (watch this — it's Egypt's silent killer; target < 8%) ·
delivery success rate (Bosta) · review rate.

---

## 9. 90-Day Execution Roadmap

**Days 1–30 — Foundation & look:**
- ✅ Homepage redesign (vibrant, CTA-driven) + /bride landing + admin toggle.
- Real product photography (replace gradient SVG placeholders) — non-negotiable for Class A/B.
- Buy domain, deploy to production, flip Paymob + Bosta flags after live smoke tests.
- Branded packaging ordered (500 boxes + thank-you/referral cards).
- Instagram: 15 reels backlog before launch; profile grid curated.

**Days 31–60 — Launch & learn:**
- Soft launch to friends/family + 10 seeded micro-influencers.
- Paid ads on at 300 EGP/day; iterate creative weekly; kill anything CPA > 150 EGP.
- Turn ON bundles flag with 2 offers; free-shipping progress bar in cart.
- WhatsApp post-purchase flow live (manual at first is fine).

**Days 61–90 — Double down:**
- Scale winning ad sets; launch retargeting via Conversion API.
- First bridal partnership signed (photographer or planner).
- First 1688 bulk order for the top 3 proven products.
- Review-submit UI on storefront; UGC wall from tagged posts.
- Decision gate: if repeat rate < 10% by day 90, fix retention before adding ad spend.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| EGP devaluation | Landed-cost engine reprices daily; USD-based cost inputs |
| COD refusals eat margin | WhatsApp confirmation before dispatch; push Paymob prepay with small incentive (e.g., free gift wrap) |
| Customs/regulation changes | Rates are settings-driven; verify before every bulk import |
| Temu supply breaks | Micro-warehouse buffer stock for bestsellers; stock-sync cron auto-zeroes OOS items |
| Platform copycats | Brand + packaging + bridal/custom moat — hard to copy an experience |
| Ad account bans (common in EG) | Backup Business Manager + organic/UGC channel never below 50% of new customers |

---

*Platform notes: bundles, pre-orders, promo codes, wallet, social-proof section, dynamic
pricing, Paymob, and Bosta are already implemented behind feature flags — every growth tactic
above is a switch, not a project.*
