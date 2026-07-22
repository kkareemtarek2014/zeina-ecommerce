# Admin Redesign — Concept & Styling (Sqoosh)

> Goal: make the admin **easy for one non-technical operator** to run the store daily.
> Companion docs: `02-plan.md` (phases) · `03-phase-7.md` (ops intelligence) · `tasks.md` (checklist).
> Obeys all rules in `CLAUDE.md` (features, barrels, tokens-only styling, no `any`).

---

## 1. Diagnosis — why the current admin is hard

| Problem | Evidence |
| --- | --- |
| Flat navigation overload | 18 sidebar links in one flat list (`AdminShell.tsx` NAV) — no grouping, no hierarchy |
| Dashboard is a wall of data | `DashboardView.tsx`: 8 stat cards + 7 stacked sections in one long scroll; nothing tells the admin **what to do next** |
| Forms are overwhelming | `ProductForm.tsx` (456 lines, ~20 fields in one column), `SettingsForm.tsx` (834 lines, everything on one page, one giant save) |
| Order processing is slow | Orders list → click → full page navigation per order; no inline status change, no bulk actions, no COD helpers |
| Table-first, not task-first | Every page is "a table of a DB entity". The admin's real job is: *ship today's orders, restock, add a product* |
| Generic look | Cards + borders everywhere, no visual rhythm, no Sqoosh personality |

## 2. The new idea — "Ops-first admin"

Reorganize the admin around the operator's **daily job**, not around database tables.
Three principles:

1. **Action before information.** The first thing on every screen answers "what needs my
   attention?" — orders to confirm, stock to refill — with one-click actions.
2. **Never leave the list.** Routine work (change order status, tweak stock, toggle a promo)
   happens inline or in a side drawer. Full pages are only for deep editing.
3. **Short forms, small saves.** Every big form becomes tabbed sections or separate small
   pages, each with its own save. Nobody scrolls 800 lines to change a shipping fee.

### 2.1 New information architecture (sidebar)

Five collapsible groups replace the flat 18-item list (same routes, RBAC-filtered as today):

```
🏠 Overview
   Dashboard                    /admin

🧸 Catalog
   Products                     /admin/products
   Categories                   /admin/categories
   Bundles                      /admin/bundles
   Media                        /admin/media
   Import (Alibaba)             /admin/import

📦 Sales                        ← the daily workspace
   Orders          (badge: n)   /admin/orders
   Shipments                    /admin/shipments
   Promos                       /admin/promos

👤 Customers
   Users                        /admin/users

⚙️ System
   Homepage                     /admin/homepage   (flag: homepage_builder)
   Locations                    /admin/locations
   Activity log                 /admin/activity
   Cron jobs                    /admin/cron
   Settings                     /admin/settings
```

Details: group headers are collapsible (state in `localStorage`, key `sqoosh-admin-nav` — UI
preference only, allowed); Orders shows a live badge of orders needing action
(`pending + confirmed` from the stats endpoint); on mobile the sidebar becomes a bottom
sheet, and a bottom tab bar exposes the four most-used items (Dashboard, Orders, Products,
More).

### 2.2 Dashboard → "Today" screen

Replace the stat wall with a screen that reads top-to-bottom as *do → watch → browse*:

1. **Action strip** (top): up to 3 attention cards, each with a CTA —
   "🔔 5 orders waiting confirmation → Review", "⚠️ 3 products low on stock → Restock",
   "📦 2 shipments pending pickup → View". Hidden when empty ("All clear ✨").
2. **Compact stats row**: 4 stat chips (Today revenue · Month revenue · Orders · Avg order)
   with small deltas vs previous period. The second row of 4 cards is removed; Products/Users
   counts move next to their list pages.
3. **Sales chart + order-status funnel** side by side (2-col on `lg`).
4. **Tabbed panel** instead of 5 stacked sections: tabs `Recent orders · Best sellers ·
   Most viewed · Low stock · Activity` (reuse `Tabs` from shared UI).

`TemuScraperToggle` moves off the dashboard into Settings → Integrations.

### 2.3 Orders — the workflow screen (biggest win)

- **Status tabs** across the top (Needs action · Pending · Confirmed · Shipped · Delivered ·
  Cancelled · All) with counts — replaces the status `<Select>`. "Needs action" =
  pending + confirmed.
- **Row quick actions**: an "advance status" button directly in the row
  (Pending → Confirm, Confirmed → Ship, …) using the existing status-update mutation; no
  page navigation for the 90% case.
- **Order drawer**: clicking a row opens a right-side `Drawer` (shared UI) with items,
  address, totals, status timeline, and actions — full page (`/admin/orders/[id]`) stays for
  deep cases/printing.
- **COD helpers** in row + drawer: copy address button, `wa.me` WhatsApp link to the
  customer's phone, printable packing slip from the order page.
- **Bulk actions**: checkbox column + bulk status advance for same-status selections
  (needs small `POST /api/admin/orders/bulk-status` or looped mutations — see tasks).

### 2.4 Forms — split everything

**ProductForm** → 4 tabs with a sticky save bar (dirty-state aware, single submit as today):

| Tab | Fields |
| --- | --- |
| Basics | name, category, status, slug, SKU, tags, description |
| Pricing & stock | basePrice, basePriceUsd, compare-at, initial stock, fulfilment type, pre-order ETA |
| Media | images (uploader + media picker), format |
| SEO | seoTitle, seoDescription, OG image, canonical |

**SettingsForm (834 lines)** → a settings **hub page** with cards linking to small sub-pages,
each its own form + save:

```
/admin/settings                → hub (cards)
/admin/settings/store          → store info, contact, social
/admin/settings/shipping       → zone fees, free-shipping threshold
/admin/settings/pricing        → profit margin, dynamic-pricing inputs
/admin/settings/integrations   → Paymob, Bosta, scraper toggle, flags status
/admin/settings/seo            → default SEO title/description
```

**All admin forms** get: sticky bottom save bar (Save / Discard, only when dirty), inline
Zod errors as today, and an unsaved-changes guard on navigation.

### 2.5 Shared admin primitives (new, in `features/admin/components/ui/`)

| Component | Purpose |
| --- | --- |
| `AdminPageHeader` | title + subtitle + breadcrumbs + primary action button — one consistent header everywhere |
| `SectionCard` | white card, `--radius-lg`, title/description/action slot — replaces ad-hoc `<section>` markup |
| `StatChip` | compact stat with label, value, optional delta + icon |
| `ActionCard` | attention card for the dashboard action strip |
| `StatusPill` | colored order/product status pill (single color map, used in tables, drawer, timeline) |
| `FormTabs` + `StickySaveBar` | tabbed form shell + dirty-state save bar |
| `EmptyState` | friendly illustration/emoji + one CTA, for every empty table |
| `FilterBar` | consistent search + filter row above tables |

Generic table/pagination stay in `shared/components/ui` (`DataTable`, `Pagination`).

## 3. Styling — "Sqoosh Ocean Calm, admin flavor"

Everything flows from `src/styles/tokens.css` (never hardcode hex). The admin inherits the
brand automatically, including the Phase-A font/palette swap (Baloo 2 / Nunito via
`--font-display` / `--font-sans`).

### 3.1 Admin-scoped tokens (add to `tokens.css`)

```css
/* Admin surfaces — slightly cooler/denser than storefront */
--color-admin-sidebar:      #22333a;  /* deep slate — sidebar bg (reuses surface-overlay tone) */
--color-admin-sidebar-text: #b9c7cb;  /* muted text on dark sidebar */
--color-admin-sidebar-active: #129488;/* = brand-primary; active item fill */
```

Only these three are new; everything else reuses existing tokens.

### 3.2 The look

- **Dark teal-slate sidebar** (`--color-admin-sidebar`) with cream content area
  (`--color-surface`) — instantly separates "admin chrome" from "content", gives the admin a
  distinct identity vs the storefront while staying on-palette. Active item: teal fill
  (`brand-primary`), white text, `--radius` pill shape. Group labels: tiny uppercase muted.
- **Cards**: `surface-raised` white, `--radius-lg` (chubby, squishy feel), border
  `--color-border`, **no shadows** except drawers/modals.
- **Action color discipline**: teal is the *only* action color (buttons, links, active
  states). Apricot `brand-accent` only for badges/attention counts. Status pills use the
  four `status-*` tokens.
- **Typography**: `font-display` for page titles and stat values only; everything else
  `font-sans`. Base size 14px in admin tables/forms (denser than storefront).
- **Density**: tables `py-2.5` rows, hover row tint `brand-blush/40`; forms max-width
  `max-w-2xl` per tab (no full-width inputs on desktop).
- **Motion**: CSS-only per rule 7 — `animate-fade-up` on page enter, `animate-pop` on badges;
  drawer slide is a CSS transition. Respect `prefers-reduced-motion` (already global).
- **Status colors** (single map in `StatusPill`): pending `status-warning` · confirmed
  `status-info` · shipped `brand-primary` · delivered `status-success` · cancelled
  `status-error` · draft `text-muted`.

### 3.3 Accessibility & i18n

WCAG per rule 5: real `<label>`s, `aria-label` on icon buttons, `aria-current` on nav,
focus rings (`focus-visible:ring-brand-primary`), 4.5:1 contrast on the dark sidebar
(sidebar-text #b9c7cb on #22333a passes). Layout uses logical properties/flex order where
cheap, so the later Arabic RTL pass (roadmap) doesn't fight the admin.

## 4. Explicitly out of scope

Command palette (nice-to-have, listed as stretch in tasks), dark mode for content area,
new API endpoints beyond the optional bulk-status route, bridal admin pages (being removed
— rebrand Phase E), any storefront changes.
