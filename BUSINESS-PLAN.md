# Sqoosh (سكوش) — Business Plan v1

> **Sqoosh** = squishy stress toys & desk fidgets for Egypt.
> Replaces the former Zaya (women's accessories) plan. The platform (storefront + admin +
> integrations) is reused as-is; only the business layer changes.
> Brand identity: `docs/brand/brand-identity.md` · Styling: `docs/brand/color-styling-guide.md` ·
> Catalog & sourcing: `docs/brand/catalog-categories-sourcing.md` ·
> Code migration: `docs/rebrand-migration-plan.md`.

---

## 1. Executive Summary

**Vision:** Egypt's calm brand. We sell **one product type only — squishy stress toys** in
three sizes (Small / Medium / Large) — and we're the brand people reach for when they want to
feel less stressed. Positioning is wellness-first ("everyday calm gear"), not a toy shop —
that's where the fidget/sensory market's winning brands sit. See
`docs/brand/brand-identity.md` §3 for the research-backed calm positioning and the
honest-claims rule (no medical claims, ever).

**One-liner:** *"Squeeze the stress away — squishy stress toys delivered anywhere in Egypt."*

**Why this works in Egypt right now:**

1. **Impulse-friendly price point** — 79–349 EGP items need no deliberation. Low basket risk =
   high conversion, easy gifting, easy repeat purchase.
2. **Massive margin room** — Alibaba unit costs are $0.30–$2.00 (e.g. glow-in-the-dark dumpling
   squishies). Even after shipping + customs, 60–150% margins are realistic at prices that still
   feel cheap to the customer.
3. **Content sells itself** — squishing, slow-rising, and glow videos are natively viral on
   TikTok/Reels. The product IS the ad; no styling shoots needed.
4. **A real platform, not a DM funnel** — search, reviews, order tracking, promo codes, bundles,
   COD + card/wallet (Paymob), Bosta fulfilment. Buying takes 90 seconds.

**Target audience (broader than the old brand):**

- **Core:** teens & young adults 13–30 (students, gamers, K-culture/anime fans) — collectors and
  stress-squeezers.
- **Second:** office workers 25–40 — desk toys, "anti-stress" self-gifts.
- **Third:** parents & gift buyers — birthday/party gifts, sensory toys for kids.

**Month-12 goals:** 500 orders/month · repeat rate > 25% · AOV ≥ 300 EGP (via bundles/mystery
boxes) · organic (UGC + referral) ≥ 40% of new customers.

---

## 2. Product & Sourcing — Alibaba micro-warehousing

- **Source:** Alibaba (small-bulk MOQs, 50–500 units per SKU). Example anchor product:
  glow-in-the-dark dumpling squishies (~$0.5–1/unit at MOQ). Test SKUs in small quantities,
  hold stock locally, ship via Bosta.
- **Winner rule:** any SKU selling >15 units/month for 2 consecutive months → reorder in 3–5×
  quantity at a lower negotiated unit price (or move to a direct manufacturer).
- **Curation rule:** 30–50 live SKUs max — **squishies only**, organized by size
  (see catalog doc): **Small · Medium · Large**. Themes (food, animals, glow) are tags/filters,
  not categories. If it doesn't squish, we don't sell it.
- **Quality gate:** every incoming batch gets a squeeze/rebound test + smell check (cheap PU foam
  can smell). Reject supplier batches that fail — refund disputes on Alibaba are winnable with
  video evidence.
- **The unboxing IS the ad:** branded mailer + sticker + thank-you card with a **referral code**.
  Squishy unboxings are inherently filmable — target 1 in 8 customers posting a story.
- **Drops, not catalog:** monthly themed drops (e.g. "Glow Night", "Snack Attack", "Kawaii Zoo").
  Each drop gets a homepage moment (homepage builder) + a content batch.

## 2b. Pricing

- **Flat model (default):** landed EGP cost × **(1 + 60% margin)**, rounded up to 5 EGP.
  Allowed range 40–80% — cheap COGS means percentage margin can be high while absolute prices
  stay impulse-friendly. Update `PROFIT_MARGIN` accordingly (see migration plan).
- **Landed-cost engine** (`dynamic_pricing` flag, already built): USD base × live FX + shipping +
  customs + VAT + handling → target margin. Turn on once Alibaba invoicing is USD-based.
  Verify customs category for toys (HS codes for PU/TPR toys differ from accessories).
- **Price ladder = the size categories (clean mental model):**
  | Category | Price | Role |
  | --- | --- | --- |
  | Small (under ~7 cm) | 79–129 EGP | Entry impulse buy, pocket calm, cart filler |
  | Medium (~7–14 cm) | 149–249 EGP | Core volume — the daily-squeeze hero |
  | Large (15 cm+) | 249–349 EGP | Big slow-rising squeeze, gifts |
  | Bundles & mystery boxes | 349–699 EGP | AOV engine (bundle products, not a category) |
- **Free shipping threshold:** lower from 1,500 → **500 EGP** (matches the cheaper basket;
  admin-editable in settings). "Add X EGP for free shipping" bar + gap-closing recommendations
  (already built) become the main AOV lever.

---

## 3. Website Conversion Plan (CRO)

The trust features already exist (reviews, order timeline, COD + Paymob, promo codes). The tone
changes from "elegant" to **playful and satisfying**:

1. **Hero that squishes** — bold candy-pastel hero with a looping product video/GIF of a squish.
   Two CTAs: *Shop New Drop* (primary) and *Best Squishies* (secondary).
2. **Announcement bar** (settings-driven, already built) — rotating: "Free shipping over 500 EGP" ·
   "COD available" · "New drop every month" · "Glow collection is live 🌙".
3. **Shop-by-size tiles** — Small / Medium / Large with use-case copy ("pocket calm" /
   "desk companion" / "the big squeeze") — one tap from purchase intent. Theme tags (glow,
   food, animals) surface as filter chips, not tiles.
4. **Social proof band** — ratings, review counts, UGC/Instagram wall (`social_proof` flag).
5. **Mystery box spotlight** — replaces the old bridal spotlight as the premium homepage moment.
6. **Every section ends in a CTA.** No scroll-depth without a tappable next step.

**Conversion targets:** visitor → add-to-cart ≥ 8% (impulse category, should beat accessories) ·
cart → checkout ≥ 40% · checkout → order ≥ 65%. Meta Pixel + Conversion API at each step.

**AOV levers (features already built — switch on):**
- **Bundles flag:** "3 for 399", "Squad pack (5 minis)", themed sets. Highest priority flag.
- **Mystery boxes:** sold as bundle products ("Mystery Squish Box — 4 surprises, 349 EGP").
  Zero customization — contents are pre-packed per batch.
- **Pre-orders flag:** sold-out virals stay sellable with a 2–3 week ETA.
- **Cart recommendations + free-shipping progress bar** (live).

---

## 4. Customer Acquisition

**Channel plan, priority order:**

1. **TikTok + Instagram Reels (organic), video-first.** 5–7 posts/week: squish-and-release ASMR,
   slow-rising timelapses, glow-in-the-dark reveals, "packing your order" POVs, drop teasers.
   Every video ends with a spoken CTA + link.
2. **UGC / referral loop.** Card in every box: "Post your squish, tag @sqoosh.eg, get 10% off —
   your friends get 10% too." (Promo-code engine already supports this.)
3. **Micro-influencer seeding.** 10 boxes/month to Egyptian lifestyle/study-with-me/gaming
   creators (5k–100k). Squishies are cheap to seed — CAC on seeding is tiny vs. accessories.
4. **Paid ads (Meta + TikTok):** video views top-funnel → catalog ads middle → add-to-cart
   retargeting bottom. Start 300 EGP/day; scale only when CPA ≤ 80 EGP (cheaper product needs a
   cheaper CPA than the old 120 EGP target).
5. **School/office seasonal pushes:** back-to-school (small squishies for the pencil case),
   exams season ("survive finals" calm kits), Ramadan/Eid gifting (mystery boxes).
6. **WhatsApp concierge** for order confirmations + "help me pick a gift".

---

## 5. Retention — collectability is the engine

Squishies are inherently collectible; retention is easier than accessories.

- **Post-purchase flow (WhatsApp/SMS):** D0 confirmation → D2 shipped + tracking → D7 review ask
  ("rate the squish") → D21 10% off the next drop (personal promo code).
- **Drop calendar:** monthly drops create a reason to return; announce to past buyers first
  (early-access WhatsApp broadcast = VIP feeling at zero cost).
- **Collect-them-all mechanics:** number the series ("Glow Dumplings 1–6"); show "you own 2 of 6"
  in future iterations (roadmap idea, not required for launch).
- **Win-back:** 60 days inactive → "new drop you haven't seen" + curated picks.
- **Wallet credit** (flag exists, OFF): refund-to-wallet keeps money in the store when it flips on.
- **Review engine:** delivered order → review request; photo/video reviews earn a bonus code.

---

## 6. Unit Economics & KPIs

**Example order (validate monthly against real data):**

| Line | EGP |
| --- | --- |
| AOV (2–3 items) | 300 |
| Landed cost of goods (~$1.5 total COGS) | ~110 |
| Packaging (mailer + sticker + card) | ~15 |
| Bosta shipping (blended, partly passed on) | ~55 |
| Payment fees (Paymob ~2.75% when card) | ~8 |
| Marketing (blended CPA ÷ orders) | ~70 |
| **Contribution profit** | **~40–90 / order** |

Volume + repeat rate matter more than per-order profit — this is a frequency business, unlike
accessories. Bundles/mystery boxes lift both AOV and contribution.

**Weekly KPI dashboard (admin stats exist — track):** sessions → CVR → orders · AOV · CPA by
channel · repeat rate · bundle/mystery % of revenue · COD refusal rate (target < 8%) · delivery
success rate · review rate · % orders containing >1 item.

---

## 7. 90-Day Execution Roadmap

**Days 1–30 — Rebrand & stock:**
- Execute `docs/rebrand-migration-plan.md`: name, palette, categories, copy, SEO, remove bridal.
- Place first Alibaba order: 8–12 SKUs across Small/Medium/Large (60–150 units each — see
  catalog doc §3).
- Real product photos + squish videos for every SKU (phone + lightbox is enough).
- Branded packaging ordered (mailers + stickers + referral cards).
- TikTok/IG: 15-video backlog before launch.

**Days 31–60 — Launch & learn:**
- Soft launch to friends/family + 10 seeded creators.
- Paid ads at 300 EGP/day; kill creatives with CPA > 100 EGP.
- Turn ON `bundles` with 2 offers + first mystery box batch.
- WhatsApp post-purchase flow live (manual is fine).

**Days 61–90 — Double down:**
- Scale winning ad sets; Conversion-API retargeting on.
- First monthly themed drop with early access for past buyers.
- Reorder winners at 3–5× volume; negotiate unit price down.
- Review-submit UI on storefront (roadmap item); UGC wall on.
- Decision gate: repeat rate < 10% by day 90 → fix retention before scaling spend.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| EGP devaluation | Landed-cost engine reprices daily (flag ready); USD cost inputs |
| Trend fades (fad risk) | Small MOQs, monthly drops, category diversity (desk fidgets are evergreen; food/animal squishies outlast individual virals) |
| Quality/smell complaints | Batch QC gate + supplier video-evidence disputes; never ship a batch that fails the squeeze test |
| COD refusals | WhatsApp confirmation before dispatch; low price point reduces refusal risk vs. accessories |
| Customs classification | Toys have different HS codes/duties than accessories — confirm with broker before first bulk import; rates are settings-driven |
| Copycat sellers | Brand + packaging + drop cadence + UGC community moat; speed of curation is the edge |
| Ad account bans | Backup Business Manager; organic/UGC never below 40% of new customers |

---

*Platform notes: bundles, pre-orders, promo codes, wallet, social proof, dynamic pricing, Paymob,
and Bosta are already implemented behind feature flags — every tactic above is a switch, not a
project. Bridal/custom is removed from the business entirely (see migration plan).*
