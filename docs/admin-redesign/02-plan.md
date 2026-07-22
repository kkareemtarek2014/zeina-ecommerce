# Admin Redesign — Plan

> Concept & styling: `01-concept-and-styling.md` · Phase 7 detail: `03-phase-7.md` ·
> Executable checklist: `tasks.md`.
> Each phase is independently shippable; run the CLAUDE.md verification block after each.

---

## Guiding constraints

- **No API/contract changes** except one optional bulk-status endpoint (Phase 3). Everything
  else is UI + composition over existing hooks/services.
- **Same routes, same RBAC.** Navigation is regrouped, URLs don't change (new
  `/admin/settings/*` sub-routes are additive; the old page becomes the hub).
- **Tokens only** — no hardcoded hex; admin inherits rebrand Phase A automatically.
- **Incremental** — old and new components coexist; each phase replaces a slice and deletes
  what it replaced (no dead code left behind).

## Phases

### Phase 1 — Foundation: tokens + admin UI kit  *(no visible change yet)*

Add the 3 admin sidebar tokens to `tokens.css` (+ `@theme inline` mapping in `globals.css`).
Build the primitives in `src/features/admin/components/ui/` with a barrel:
`AdminPageHeader`, `SectionCard`, `StatChip`, `ActionCard`, `StatusPill`, `EmptyState`,
`FilterBar`, `FormTabs`, `StickySaveBar`. Unit-simple, presentational, typed props, no data
fetching.

*Exit:* kit renders in isolation; build/typecheck/lint clean.

### Phase 2 — Shell: grouped sidebar + topbar + page headers

Rewrite `AdminShell.tsx`: dark grouped collapsible sidebar (5 groups), orders badge, mobile
bottom tabs + sheet, restyled topbar. Sweep all admin pages to use `AdminPageHeader`
(replaces per-page breadcrumb + h1 markup).

*Exit:* every admin page renders under the new shell; nav state persists; RBAC filtering
unchanged.

### Phase 3 — Orders workflow  *(highest impact)*

Status tabs with counts, row quick-advance action, order `Drawer` quick view, COD helpers
(copy address, WhatsApp link), bulk selection + bulk advance. Optional:
`POST /api/admin/orders/bulk-status` (else loop the existing mutation). Restyle
`/admin/orders/[id]` with `SectionCard` + `StatusPill` timeline + print-friendly packing slip.

*Exit:* an order can go pending → delivered without ever leaving `/admin/orders`.

### Phase 4 — Dashboard → "Today"

Rebuild `DashboardView` per concept §2.2: action strip, 4 stat chips with deltas, chart +
funnel row, tabbed lists panel. Move `TemuScraperToggle` out (parked until Phase 5 hub
exists — temporarily under a "Tools" `SectionCard` at the bottom if Phase 5 isn't merged
yet). Delete `StatCard` (replaced by `StatChip`).

*Exit:* dashboard fits ~2 screens on desktop; every attention item has a CTA.

### Phase 5 — Forms: product tabs + settings split

`ProductForm` → `FormTabs` (Basics / Pricing & stock / Media / SEO) + `StickySaveBar` +
per-tab error badges (single RHF form, single submit — tab switching never loses state).
`SettingsForm` → hub page + 5 sub-pages (`store`, `shipping`, `pricing`, `integrations`,
`seo`), each a small RHF+Zod form saving only its slice via the existing settings
service; `TemuScraperToggle` lands in `integrations`. Add unsaved-changes guard hook.

*Exit:* `SettingsForm.tsx` deleted; no admin form longer than one screen per tab/section.

### Phase 6 — Polish sweep + remaining pages

Apply kit to remaining list pages (products, categories, users, promos, bundles, media,
locations, shipments, activity, import): `FilterBar`, `EmptyState`, `StatusPill`, consistent
density. Loading skeletons for admin routes per rule 11. Stretch: Cmd+K command palette
(client-side route/action jumper).

*Exit:* zero ad-hoc page headers/empty states left in `features/admin`; jscpd shows no new
duplication.

## Sequencing & effort

| Phase | Depends on | Effort | Value |
| --- | --- | --- | --- |
| 1 Foundation | — | S–M | enabler |
| 2 Shell | 1 | M | high |
| 3 Orders | 1 (2 cosmetic) | M–L | **highest** |
| 4 Dashboard | 1–2 | M | high |
| 5 Forms | 1 | L | high |
| 6 Polish | 1–2 | M | medium |

Recommended order: 1 → 2 → 3 → 4 → 5 → 6. Phases 3/4/5 can be parallelized after 2 if needed.

### Phase 7 — Ops intelligence

Extend the Today dashboard and list APIs so a solo COD operator can act without leaving
`/admin`: previous-period deltas on revenue chips, COD-to-collect total, inline needs-action
order queue with `OrderQuickActions`, server-side `?lowStock=1` on products, and Cmd+K
command palette (promotes stretch 6.6). Details in `03-phase-7.md`.

*Exit:* deltas + COD chip + queue live; Restock deep-link returns the real low-stock set;
Cmd+K jumps work.

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Settings split breaks save semantics | Sub-forms reuse the existing settings contract; each submits a partial update through the same service; verify with `assert:no-secrets` |
| Tab forms lose RHF state | One `useForm` at `ProductForm` root; tabs only hide/show sections (CSS/conditional render with `shouldUnregister: false`) |
| Bulk status hits invalid transitions | Client only offers bulk advance when all selected orders share a status; server still validates each transition |
| Sidebar regroup confuses muscle memory | Routes unchanged; groups default expanded on first run |
| Rebrand Phase A lands mid-redesign | All styling is token-driven — palette/font swap flows through with zero admin rework |

## Verification (every phase)

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```

Plus a manual pass: mobile (375px) + desktop, keyboard-only nav on the new shell, and the
orders happy path (pending → delivered inline).
