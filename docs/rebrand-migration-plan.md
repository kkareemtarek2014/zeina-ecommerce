# Zaya → Sqoosh — Rebrand Migration Plan

> The single map of everything that changes in code/content to go from Zaya (women's
> accessories) to **Sqoosh** (squishy stress toys). Docs are already rewritten; this plan is the
> input for the future `tasks.md`. **No code has been changed yet** — the codebase still says
> Zaya until these phases run.

---

## 1. Principles

1. **Keep the platform, swap the business.** Architecture, features, flags, admin, integrations
   (Paymob/Bosta), SEO infrastructure, skeletons — all stay. This is a re-skin + re-catalog,
   not a rebuild.
2. **No customization anywhere.** Bridal/custom is removed, and nothing replaces it — mystery
   boxes are pre-packed bundles, never build-your-own.
3. **Tokens-first styling.** The visual rebrand is ~90% a `tokens.css` + font swap; components
   inherit.

## 2. Feature disposition (kept / reused / removed)

| Feature | Decision | Notes |
| --- | --- | --- |
| Shop/catalog, product, search, cart, checkout, orders, account, auth | **Keep** | Content changes only |
| Reviews (+ create API) | **Keep** | "Rate the squish"; storefront submit UI stays on roadmap |
| Promos engine | **Keep** | Referral/UGC codes (§4 of business plan) |
| Bundles flag | **Keep — promote** | Core AOV engine: 3-packs + mystery boxes |
| Pre-orders flag | **Keep** | Sold-out virals stay sellable |
| Social proof flag | **Keep** | UGC wall fits squishies even better |
| Wallet flag | **Keep (OFF)** | Flip when refunds start |
| Homepage builder | **Keep** | Monthly drop swaps (see updated `docs/monday-drop-ritual.md`) |
| Dynamic pricing / landed-cost engine | **Keep (OFF)** | Turn on with USD Alibaba invoicing; verify toy HS codes |
| Paymob / Bosta integrations | **Keep (OFF)** | Unchanged go-live plan |
| Admin (all) | **Keep** | Categories/products content changes only |
| SEO infra (metadata, JSON-LD, sitemap, robots) | **Keep** | Re-keyword (§5) |
| Skeletons / loading UX | **Keep** | Inherit new tokens |
| **Bridal + custom requests** | **REMOVE** | §7 below |
| Social auth flag | Keep (OFF) | Unchanged |

## 3. Phase A — Identity & styling (code)

- [ ] `src/config/site.config.ts`: `SITE.name` → `Sqoosh`, tagline/description/keywords from
      `docs/brand/brand-identity.md`; `SITE.url` placeholder → `https://sqoosh-eg.com` (update
      when bought).
- [ ] `PROFIT_MARGIN` `0.25` → `0.60` (allowed 40–80%) — update CLAUDE.md table if changed.
- [ ] `FREE_SHIPPING_THRESHOLD` `1500` → `500` (+ update D1 settings value — settings are the
      live source; keep config fallback in sync).
- [ ] `src/styles/tokens.css`: replace palette + radii with the block in
      `docs/brand/color-styling-guide.md` §2 (variable names unchanged).
- [ ] `src/app/layout.tsx`: `next/font` swap — Playfair→Baloo 2, Jost→Nunito (var names
      `--font-playfair`/`--font-jost` can stay or be renamed; if renamed, update `tokens.css`).
- [ ] Admin settings (D1): `site_name`, `site_tagline`, `footer_text`, SEO defaults, social
      handles → Sqoosh values (via /admin/settings — no code).
- [ ] README.md header/blurb → Sqoosh (done in docs pass? verify).
- [ ] Logo/favicon placeholder swap (`public/`), mascot later.

## 4. Phase B — Catalog & content (mostly admin/seed)

- [ ] Categories: replace the 7 accessories categories with the **3 size categories**
      (`small` / `medium` / `large`) from `docs/brand/catalog-categories-sourcing.md` §1
      (admin CRUD + seed update in `src/shared/data/` for sitemap until D1-backed sitemap
      ships). Themes (food/animal/glow/…) become product **tags**, not categories.
- [ ] Products: archive all accessories SKUs (DELETE = archive); create launch assortment as
      drafts → publish when photographed.
- [ ] Homepage blocks: hero (squish video still), shop-by-vibe collection tiles, mystery-box
      spotlight (replaces bridal spotlight), announcement rotation (500 EGP threshold copy).
- [ ] Static marketing pages (`/about`, `/contact`): rewrite copy for Sqoosh (still static JSX
      per CMS plan golden rules).
- [ ] Legal pages: find/replace brand name; review returns policy wording for toys.

## 5. Phase C — SEO re-keyword

- [ ] `SITE.keywords`: `سكويشي`, `سكويشي مصر`, `العاب ضغط`, `فيدجت`, `squishy toys Egypt`,
      `stress toys Egypt`, `fidget toys Egypt`, `cash on delivery`, `Sqoosh`, `سكوش`.
- [ ] Per-category meta + `seoDescription` for the 3 size categories (calm/stress-relief
      angle per size).
- [ ] Product JSON-LD unchanged structurally; Organization/WebSite JSON-LD name → Sqoosh.
- [ ] Sitemap: still seed-driven — updating seed categories (Phase B) keeps it correct;
      D1-backed sitemap remains on the roadmap.
- [ ] Keep cart/checkout/order noindex rules.

## 6. Phase D — Storage & internals

- [ ] Zustand persist keys `Zaya-cart` / `Zaya-favorites` / `Zaya-recently-viewed` →
      `Sqoosh-*`. Pre-launch there are no real customers: a hard rename (old carts dropped) is
      acceptable; skip migration code.
- [ ] Grep sweep: `Zaya` / `zaya` / `زينة` across `src/` (copy, aria-labels, email templates,
      comments) → Sqoosh equivalents.
- [ ] `CLAUDE.md` / `AGENTS.md` stay the source of truth — already rewritten for Sqoosh.

## 7. Phase E — Bridal/custom removal (no replacement)

Order matters: flags → routes → feature code → data.

- [ ] Flags/settings: `bridal_page_enabled`, `bridal_custom_enabled`, `bridal_show_*` → remove
      from settings + features config (not just OFF).
- [ ] Routes: delete `/bride`, `/bride/custom`, `/admin/bridal`, `/admin/bridal/[id]`;
      middleware entries removed; ensure 404s.
- [ ] Feature code: delete `src/features/bridal-custom/`; remove barrel imports, homepage
      bridal spotlight references, nav/footer links.
- [ ] API + server: remove `/api/bridal-requests`, bridal service/repo/mappers, related
      contracts.
- [ ] DB: drop/archive bridal tables in a migration; keep an export of any existing request
      data first.
- [ ] `bride` category: remove from categories + sitemap + `generateStaticParams`.
- [ ] Skeletons: remove `Bride*` skeleton compositions and their `ui/index.ts` exports.
- [ ] Verify: `pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets` + grep for
      `bridal|bride`.

## 8. Docs disposition (this pass — done)

| Doc | Action |
| --- | --- |
| `BUSINESS-PLAN.md` | **Rewritten** for Sqoosh |
| `CLAUDE.md`, `AGENTS.md` | **Rewritten** (business layer; architecture unchanged) |
| `README.md` | Header/blurb updated |
| `docs/brand/*` (3 files) + this plan | **New** |
| `docs/psychology-conversion-styling.md` | **Deleted** — reusable levers folded into `color-styling-guide.md` §6 |
| root `tasks.md` (psych backlog) | **Deleted** — items were done/obsolete; new `tasks.md` comes later from this plan |
| `docs/monday-drop-ritual.md` | Updated examples (squishy categories) |
| `docs/backend/*` | **Kept** — technical specs still valid; read "Temu" as "Alibaba", ignore bridal references (removal tracked here §7) |
| `docs/cms-content-and-image-plan.md`, `docs/tasks.md` (CMS tasks) | **Kept** — infra plans still apply; bridal rows obsolete per §7 |
| `docs/performance-seo-plan.md`, `docs/code-duplication-cleanup-plan.md` | **Kept** — unchanged |
| `AUDIT-REPORT.md` | Kept as historical record |
| `API.md` | Kept — contract unchanged until Phase E removes bridal endpoints |

## 9. Verification (after each phase)

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets
# After Phase D/E:
grep -ri --include="*.ts" --include="*.tsx" -e "zaya" -e "bridal" src/ || echo clean
```
