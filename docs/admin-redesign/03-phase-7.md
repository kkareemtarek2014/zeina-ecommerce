# Admin Redesign — Phase 7: Ops Intelligence

> Builds on Phases 1–6 (`01-concept-and-styling.md` · `02-plan.md` · `tasks.md`).
> Goal: make the **Today** dashboard actionable for a solo COD operator in Egypt —
> not more charts, more *cash and queues*.

---

## Theme

Phase 4 made the dashboard readable. Phase 7 makes it **operable**:

1. Know if today/month is up or down (deltas).
2. Confirm/ship the next orders without leaving `/admin`.
3. See how much COD cash is still out for collection.
4. Restock via a correct low-stock product list (server-filtered).
5. Jump anywhere with Cmd+K (stretch from 6.6, shipped here).

## Scope

| # | Item | Notes |
| --- | --- | --- |
| 7.1 | Stats deltas | Extend `AdminStatsDTO` with previous-period numbers / `%` for Today + Month (+ optional avg). Additive fields only. |
| 7.2 | COD to collect | Sum of unpaid COD order totals still in the fulfilment pipeline (`placed`…`out_for_delivery`). New chip on Today. |
| 7.3 | Needs-action queue | Top ~5 `placed`/`confirmed` orders on the dashboard with `OrderQuickActions` + link to orders list. |
| 7.4 | Server low-stock | `GET /api/admin/products?lowStock=1` filters in SQL using the same threshold as inventory. Products page uses it (replaces client-only filter). |
| 7.5 | Command palette | Client-only Cmd/Ctrl+K: fuzzy jump to nav routes + "New product" / "New promo". No new deps. |

## Out of scope

Arabic RTL, dark mode, new chart libraries, AI summaries, print-from-list (can follow later).

## Constraints

- Tokens only; barrel imports; no `any`.
- Additive API/DTO fields only (no breaking wire changes).
- Same RBAC; no storefront changes.
- Verify: `pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets`.

## Exit

Today screen shows deltas + COD chip + inline queue; Restock deep-link returns the real low-stock set; Cmd+K jumps work.
