# Admin Redesign — Tasks

> Execute in order. Concept: `01-concept-and-styling.md` · Plan: `02-plan.md`.
> After each phase: `pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets`.
> Rules that apply to every task: tokens only (no hex), barrel imports, no `any`,
> CSS-only animations, `aria-label` on icon buttons, mobile-first.

---

## Phase 1 — Foundation (admin UI kit)

- [x] **1.1 Add admin tokens**
  - `src/styles/tokens.css`: add `--color-admin-sidebar: #22333a`,
    `--color-admin-sidebar-text: #b9c7cb`, `--color-admin-sidebar-active: #129488`.
  - `src/app/globals.css`: map them in `@theme inline` (→ `bg-admin-sidebar` etc.).
- [x] **1.2 Create kit folder + barrel**
  - `src/features/admin/components/ui/index.ts`; re-export from `features/admin/index.ts`.
- [x] **1.3 `AdminPageHeader.tsx`**
  - Props: `title`, `subtitle?`, `breadcrumbs?: {label, href?}[]`, `action?: ReactNode`.
  - Renders breadcrumbs (move logic from `AdminBreadcrumbs`), `font-display` h1, subtitle,
    action button right-aligned (stacks on mobile). Absorbs/deletes `AdminBreadcrumbs` usage later (2.4).
- [x] **1.4 `SectionCard.tsx`**
  - Props: `title?`, `description?`, `action?`, `children`, `className?`.
  - `bg-surface-raised border border-border rounded-lg p-5`.
- [x] **1.5 `StatChip.tsx`**
  - Props: `label`, `value`, `delta?: number` (renders ▲/▼ + `status-success`/`status-error`),
    `hint?`, `icon?`. Value in `font-display`.
- [x] **1.6 `ActionCard.tsx`**
  - Props: `icon`, `title`, `count?`, `href`, `cta`. Apricot (`brand-accent`) count badge,
    teal CTA link. Entire card clickable (`<Link>`), `animate-fade-up`.
- [x] **1.7 `StatusPill.tsx`**
  - Props: `status: OrderStatus | ProductStatus`, `size?: 'sm'|'md'`.
  - Single color map (concept §3.2). Reuse `ORDER_STATUS_LABELS`.
- [x] **1.8 `EmptyState.tsx`**
  - Props: `emoji?`, `title`, `description?`, `action?: {label, href}`.
- [x] **1.9 `FilterBar.tsx`**
  - Layout wrapper: left slot (SearchInput), right slot (filters/selects), wraps on mobile.
- [x] **1.10 `FormTabs.tsx`**
  - Props: `tabs: {id, label, errorCount?}[]`, `active`, `onChange`, `children`.
  - Error badge (red dot + count) per tab. Panels stay mounted (hidden via `hidden`
    attribute) so RHF state survives — do NOT unmount panels.
- [x] **1.11 `StickySaveBar.tsx`**
  - Props: `isDirty`, `isSubmitting`, `onDiscard?`. Fixed bottom bar inside the form,
    only visible when dirty; Save (submit) + Discard (reset). `animate-fade-up`.
- [x] **1.12 `useUnsavedChangesGuard.ts`** (`features/admin/hooks/`)
  - `beforeunload` listener when `isDirty`. (Router-level guard is best-effort in App
    Router; document limitation in JSDoc.)
- [x] **1.13 Verify** — build/typecheck/lint clean; no page uses the kit yet.

## Phase 2 — Shell & navigation

- [x] **2.1 Nav config**
  - New `src/features/admin/config/nav.config.ts`: `NAV_GROUPS` (Overview / Catalog /
    Sales / Customers / System per concept §2.1), each item keeps `href/label/icon/permission/exact`.
    Move the flat `NAV` out of `AdminShell.tsx`.
- [x] **2.2 Rewrite `AdminSidebar`**
  - Dark: `bg-admin-sidebar`, text `admin-sidebar-text`; logo area teal on dark.
  - Collapsible groups (chevron, uppercase 11px label); persist open/closed set to
    `localStorage['sqoosh-admin-nav']` behind `useHydrated()` gate (rule 6).
  - Active item: `bg-admin-sidebar-active text-white rounded-(--radius)`; hover: `bg-white/5`.
  - Filter items with `hasPermission`; hide empty groups. Keep `aria-current`, `aria-label`s.
- [x] **2.3 Orders badge**
  - Small hook `useOrdersNeedingAction()` in `features/admin/hooks/useAdminOps.ts` deriving
    `pending + confirmed` from the existing stats query (share queryKey; no new endpoint).
  - Apricot count badge on the Orders nav item + document.title prefix `(n)` on /admin.
- [x] **2.4 Topbar + mobile**
  - Restyle topbar (keep View Website, NotificationBell, user, sign-out).
  - Mobile: bottom tab bar (Dashboard/Orders/Products/More) — `More` opens the sidebar
    sheet. Sidebar becomes overlay sheet under `lg` (existing pattern, restyled).
- [x] **2.5 Page header sweep**
  - Replace `AdminBreadcrumbs` + `<h1>` blocks with `AdminPageHeader` in all
    `src/app/admin/**/page.tsx` and admin feature views. Delete `AdminBreadcrumbs` export
    when no usages remain.
- [x] **2.6 Verify** — keyboard-nav the sidebar; check 375px; RBAC: viewer role sees same
  set of items as before regrouping.

## Phase 3 — Orders workflow

- [x] **3.1 Status tabs**
  - `src/app/admin/orders/page.tsx`: replace status `<Select>` with tab row: Needs action /
    each `ORDER_STATUS_FLOW` status / Cancelled / All, with counts from stats
    (`ordersByStatus`). "Needs action" filters client-side param `status IN (pending,
    confirmed)` — if the API takes a single status, implement as two-tab shortcut: default
    tab = `pending`, and keep counts visible. URL-sync via `?status=` (existing behavior).
- [x] **3.2 Row quick-advance**
  - New `OrderQuickActions.tsx` (features/admin/components): given order status, renders the
    single next-step button (`Confirm`, `Ship`, `Deliver`) using the existing status
    mutation from `useAdminOps`; optimistic + toast on success/error; hidden for terminal states.
  - Add as a `DataTable` column; keep the Eye/detail link.
- [x] **3.3 Order drawer**
  - `OrderDrawer.tsx` using shared `Drawer`: fetch via existing `useAdminOrder(id)` hook
    (or the `/api` service already used by the detail page). Sections: items, customer +
    address, totals, `StatusPill` timeline, quick actions, link to full page.
  - Row click (not on action buttons) opens drawer; Esc/overlay closes; focus-trapped.
- [x] **3.4 COD helpers**
  - Copy-address button (`navigator.clipboard`, toast confirm) + WhatsApp link
    `https://wa.me/2<phone digits>` (`aria-label`s) in the drawer and detail page.
- [x] **3.5 Bulk actions**
  - Checkbox column + header select-all (page scope). Bulk bar appears above the table:
    "n selected — Advance to X" enabled only when all selected share one status.
  - Preferred: `POST /api/admin/orders/bulk-status` `{ids, status}` → service loops the
    existing per-order transition (server validates each), returns per-id results envelope.
    Fallback: client `Promise.allSettled` over the existing mutation. Either way, audit-log
    entries must still be written per order.
- [x] **3.6 Restyle `/admin/orders/[id]`**
  - Rebuild page with `SectionCard`s (Items / Customer & shipping / Totals / Timeline),
    `StatusPill`, quick actions in the header. Add `@media print` styles for a clean packing
    slip (hide chrome; show items + address + COD total); "Print slip" button.
- [x] **3.7 Verify** — full inline flow pending→delivered; cancel path; bulk advance on 3
  orders; print preview.


## Phase 4 — Dashboard "Today"

- [x] **4.1 Action strip**
  - Top of `DashboardView`: `ActionCard`s from stats — orders needing action → `/admin/orders`,
    low stock (count of `lowStockProducts`) → `/admin/products?lowStock=1` (or products page
    anchor), pending shipments if available. Render "All clear ✨" `SectionCard` when all zero.
- [x] **4.2 Stat chips + deltas**
  - One row of 4 `StatChip`s: Today / This month / Orders / Avg order. Deltas only if the
    stats DTO already exposes previous-period numbers — otherwise omit delta (do NOT change
    the contract in this phase; note as follow-up).
- [x] **4.3 Chart + funnel row**
  - 2-col `lg` grid: `SalesChart` in a `SectionCard`; status funnel = existing
    status-count chips restyled as `StatusPill` + count list linking to filtered orders.
- [x] **4.4 Tabbed lists**
  - One `SectionCard` with shared `Tabs`: Recent orders / Best sellers / Most viewed /
    Low stock / Activity — reusing `RecentOrders`, `LatestProducts`, `ActivityFeed` innards;
    every tab has an `EmptyState` and a "View all" link.
- [x] **4.5 Cleanup**
  - Remove `TemuScraperToggle` from dashboard (park in a bottom "Tools" `SectionCard` until
    5.6 moves it to Settings → Integrations). Delete `StatCard.tsx`; update dashboard
    skeleton (`loading.tsx`) to match the new layout.
- [x] **4.6 Verify** — dashboard ≤ ~2 screens at 1440px; every action card navigates correctly.

## Phase 5 — Forms

- [x] **5.1 ProductForm tabs**
  - Wrap existing fields in `FormTabs`: Basics / Pricing & stock / Media / SEO (field split
    per concept §2.4). Single `useForm` (`shouldUnregister: false`); panels hidden not
    unmounted; per-tab `errorCount` derived by mapping `formState.errors` keys → tab.
    On failed submit, auto-switch to first tab with errors.
- [x] **5.2 Product sticky save**
  - Replace bottom submit button with `StickySaveBar` (`isDirty`, `isSubmitting`); wire
    `useUnsavedChangesGuard`.
- [x] **5.3 Settings hub**
  - `/admin/settings/page.tsx` → grid of link cards (Store / Shipping / Pricing /
    Integrations / SEO) with icon + description, `AdminPageHeader`.
- [x] **5.4 Settings sub-pages**
  - New routes `src/app/admin/settings/{store,shipping,pricing,integrations,seo}/page.tsx`.
  - Split `SettingsForm.tsx` into `features/admin/components/settings/` —
    `StoreSettingsForm`, `ShippingSettingsForm` (zone fees + free threshold),
    `PricingSettingsForm` (margin, dynamic-pricing inputs), `IntegrationsPanel`
    (Paymob/Bosta status via `IntegrationsStatusPanel` + `TemuScraperToggle` + `CronJobsPanel`
    link), `SeoSettingsForm`.
  - Each: own RHF+Zod schema slice, own save via the existing settings service (partial
    update with current values merged if the API expects the full object — check
    `admin-config.service.ts` and keep the wire shape unchanged). `StickySaveBar` on each.
- [x] **5.5 Middleware/guards**
  - Confirm `/admin/settings/*` sub-routes pass `requireAdmin` + `settings:write` the same
    as the parent (route group inherits `AdminGuard`; spot-check middleware matchers).
- [x] **5.6 Cleanup**
  - Delete `SettingsForm.tsx` and the dashboard "Tools" parking from 4.5. Loading skeletons
    for settings sub-routes.
- [x] **5.7 Verify** — each settings page saves independently; product create + edit round-trip
  with tab switching mid-edit; `assert:no-secrets` (margins/costs stay server-side).

## Phase 6 — Polish sweep

- [x] **6.1 List pages sweep** — products, categories, users, promos, bundles, media,
  locations, shipments, activity, import: `AdminPageHeader` + `FilterBar` + `EmptyState` +
  `StatusPill` where applicable; consistent table density (`text-sm`, `py-2.5`).
- [x] **6.2 Products low-stock filter** — support `?lowStock=1` on the products page
  (client-side filter over the existing list if no API param; needed by 4.1).
- [x] **6.3 Admin skeletons** — `loading.tsx` for admin routes using shared skeleton
  primitives (rule 11): sidebar-aware table skeleton for lists, form skeleton for editors.
- [x] **6.4 A11y pass** — keyboard-only run of shell, drawer, tabs, save bars; verify focus
  traps and `aria-*`; contrast-check dark sidebar text.
- [x] **6.5 DRY check** — `npx jscpd src/features/admin --min-tokens 40`; fold any new
  clones into the kit.
- [x] **6.6 (Stretch) Command palette** — moved to Phase 7.5 (shipped with ops intelligence).
- [x] **6.7 Final verify** — full CLAUDE.md verification block + manual mobile/desktop pass
  of every admin route.

## Phase 7 — Ops intelligence

> Spec: `03-phase-7.md`

- [x] **7.1 Stats deltas**
  - Extend `AdminStatsDTO` with previous-period fields (or ready `%` deltas) for Today /
    Month revenue and optional avg; wire `StatChip` `delta` on the dashboard.
- [x] **7.2 COD to collect**
  - Sum unpaid COD totals still in the fulfilment pipeline; add a chip on Today.
- [x] **7.3 Needs-action queue**
  - Top ~5 `placed`/`confirmed` orders on the dashboard with `OrderQuickActions`; invalidate
    stats on advance; link to filtered orders list.
- [x] **7.4 Server low-stock**
  - `GET /api/admin/products?lowStock=1` filters in SQL with settings threshold; products
    page uses the param (drop client-only filter / oversized pageSize hack).
- [x] **7.5 Command palette**
  - Cmd/Ctrl+K client modal: fuzzy jump to RBAC-filtered nav + "New product" / "New promo".
- [x] **7.6 Verify** — `pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets`.

---

## Definition of done (whole redesign)

- Orders can be processed end-to-end without leaving the list page.
- No admin form longer than one screen per tab/section; every form has sticky save + dirty guard.
- Sidebar shows 5 groups; badge counts live; mobile has bottom tabs.
- Zero hardcoded colors in `features/admin`; kit components used on every page.
- `pnpm build`, `typecheck`, `lint`, `assert:no-secrets` all clean.
