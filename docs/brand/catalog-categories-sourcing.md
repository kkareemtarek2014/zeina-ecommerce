# Sqoosh — Catalog, Categories & Alibaba Sourcing

> What we sell, how it's organized, and how it's sourced.
> **One product type only: squishy stress-relief toys.** No fidget spinners, no pop-its, no
> general toys — the catalog is squishies, organized by **size**.
> Business context: `BUSINESS-PLAN.md` §2 · Calm positioning: `brand-identity.md` §3 ·
> Code changes: `docs/rebrand-migration-plan.md` §4.

---

## 1. Categories — by SIZE (only 3)

Old accessories categories (jewelry, bags, hair, scarves, sunglasses, watches, bride) are
**fully replaced** by three size categories. Size is how customers actually choose a stress
squishy: pocket carry vs. desk companion vs. big hug.

| Slug | Name (EN) | Name (AR) | Size | Use case | Price band | Tile tint |
| --- | --- | --- | --- | --- | --- | --- |
| `small` | Small Squishies | سكوش صغير | under ~7 cm | Pocket / bag / keychain — squeeze anywhere, discreet in class or meetings | 79–129 EGP | Pink wash |
| `medium` | Medium Squishies | سكوش وسط | ~7–14 cm | The classic hand-size stress squishy — desk companion, daily de-stress | 149–249 EGP | Mint wash |
| `large` | Large Squishies | سكوش كبير | 15 cm+ | Slow-rising jumbo — big satisfying squeeze, gifts, bedside calm-down | 249–349 EGP | Lavender |

Rules:
- **Every product is a squishy stress toy.** If it doesn't squish slowly back into shape, it
  doesn't enter the catalog.
- One primary category per SKU = its size. That's it — no theme categories.
- **Themes live in tags, not categories:** `food`, `animal`, `glow`, `slow-rising`, `gift`,
  `bestseller`, `new-drop`. The search modal + shop filters already index tags, so customers
  can still find "glow" or "dumpling" without extra categories.
- **Mystery boxes are bundle products** (bundles flag), not a category — pre-packed per batch,
  never build-your-own (no customization anywhere).
- SEO: each of the 3 categories gets a calm-angle `seoDescription` (EN + AR), e.g. small =
  "pocket stress relief", large = "jumbo slow-rising squishies".

## 2. Anchor SKU example (from Alibaba)

**Glow Dumplings Squishy Toy** (Alibaba item 1601772848421 — the reference product):
- Est. unit cost at MOQ: ~$0.5–1.0 → landed ~35–60 EGP/unit.
- Sell: 149 EGP single / 3-pack 399 EGP → 60%+ margin at impulse pricing.
- Category: `medium` · tags: `glow`, `food`, `slow-rising` — ideal launch hero (filmable,
  works as a night-time calm-down toy).

## 3. Launch assortment (first Alibaba order, 8–12 SKUs)

| Category | SKUs | Qty each | Why |
| --- | --- | --- | --- |
| `small` | 3 (mini buns mixed pack, keychain squishy, pocket blob) | 150 | Entry price, cart fillers, carry-anywhere stress relief |
| `medium` | 4–5 (glow dumpling, toast, cat, axolotl, stress-ball squishy) | 100 | Core volume — the daily-squeeze heroes |
| `large` | 2 (jumbo slow-rising bun, jumbo animal) | 60 | Gift + "big squeeze" content engine |

Reorder winners at 3–5× after demand signals; mystery-box bundles assembled from overlap stock.

## 4. Sourcing playbook (Alibaba)

1. **Supplier vetting:** Gold Supplier ≥ 3 years, ≥ 4.5 rating, responds < 24h, provides video
   of the actual batch (not catalog renders). Always order samples first (or a 50-unit micro-run).
2. **Order terms:** Trade Assurance only. Photograph/video every unboxing — disputes need
   evidence.
3. **QC gate per batch (stress toys must actually relieve stress):** squeeze/rebound test
   (returns to shape < 10 s for slow-rising claims), smell check after 24 h airing (a smelly
   "calm" toy is a refund), seam check. Fail → dispute, don't ship.
4. **Safety:** avoid SKUs with small detachable parts for the kids' gift angle; note "3+" age
   guidance in descriptions. Confirm toy import HS codes and conformity requirements with the
   customs broker (rates are settings-driven).
5. **Logistics:** consolidated air freight for launch; sea for reorders of proven winners.
   `bulk_shipping_usd` setting feeds the landed-cost engine.
6. **Reorder rule:** >15 units/month × 2 months → 3–5× reorder, negotiate price; two suppliers
   per hero size to de-risk.

## 5. Product data conventions (existing schema, new content)

- `basePrice` = landed EGP cost (server-only, as today) · optional `basePriceUsd` for the
  landed-cost engine.
- **Size fields are mandatory copy:** exact dimensions in every description (customers can't
  feel it online — size surprises drive COD refusals) + which size category and why.
- Names: playful EN + Arabic nickname ("Glow Dumpling — سكوشة الدامبلينج اللي بتضوي").
- **Calm angle in every description:** one line on the stress-relief use ("slow-rising —
  breathe in while it sinks, out while it rises"). Honest claims only — see
  `brand-identity.md` §3.
- Every product: 3+ photos on pastel background + 1 squish video.
- Tags drive merchandising and filters: `food`, `animal`, `glow`, `slow-rising`, `gift`,
  `bestseller`, `new-drop`.
- Visibility rules unchanged (draft → published; lists show published only).
