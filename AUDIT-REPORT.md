# Zaya — Implementation Audit Report

Reviewed: auth, feature-toggle system, order details, and the shop/cart UI work.
Method: `tsc --noEmit`, `eslint .`, and manual review against the rules in `CLAUDE.md`.

> Note on build: `next build` could not run in this environment (the installed
> SWC binary is macOS-only and the SWC re-download needs network). Findings
> below come from the TypeScript compiler, ESLint, and code review. Run
> `pnpm build` locally to confirm the fixes.

## Verdict at a glance

| Severity | Count | Blocks build/lint? |
| --- | --- | --- |
| A. Type errors (blocking) | 1 (+2 generated) | Yes — `pnpm typecheck` fails |
| B. Lint errors (blocking) | 15 errors, 1 warning | Yes — `pnpm lint` fails (0-warning policy) |
| C. Architecture-rule violations | 6 | No, but breaks project rules |
| D. Correctness / logic bugs | 5 | No, but broken UX/behaviour |
| E. Design smells | 3 | No |

The two most important things: **duplicate auth pages** (a fake `/login` + `/register` living beside the real `/auth/*`), and **the feature toggle is not actually enforced in the UI** (disabled features still show nav links). Details below, each with a fix.

---

## A. Type errors (blocking — `pnpm typecheck` fails)

### A1. `AuthGuard` passes `className` to `<Loader>`, which takes no props
`src/features/auth/components/AuthGuard.tsx:26`
```
error TS2322: Type '{ className: string; }' is not assignable to type 'IntrinsicAttributes'.
```
`Loader` (`src/shared/components/ui/Loader.tsx`) renders a fixed full-screen loader and accepts **no props**. `<Loader className="w-8 h-8" />` therefore fails to compile.

**Fix (pick one):**
- Simplest: `<Loader />` (drop the className).
- Better: make `Loader` accept an optional `className` and a `size`, then use it. Right now every use of `Loader` is forced to the big `min-h-[60vh]` version, which is wrong inside a guard.

### A2 & A3. Generated route-type errors for `/auth`
`.next/dev/types/validator.ts(24,…)` — `Type '"/auth"' is not assignable to type 'LayoutRoutes'`.
These come from `src/app/auth/layout.tsx` on a route segment that has no page of its own. They are generated files, but the underlying cause is the `app/auth` layout. They usually disappear once the routing is cleaned up (see C1) and `.next` is rebuilt. Delete `.next` and rebuild to confirm.

---

## B. Lint errors (blocking — `eslint` reports 15 errors, policy is 0)

| File | Line | Rule | Problem |
| --- | --- | --- | --- |
| `src/app/contact/page.tsx` | 2 | no-unused-vars | `MapPin`, `Phone` imported but unused |
| `src/app/login/page.tsx` | 128 | react/no-unescaped-entities | raw `'` in JSX — use `&apos;` |
| `src/features/auth/components/AuthGuard.tsx` | 16 | react-hooks/set-state-in-effect | `setHydrated(true)` inside effect (see C2) |
| `src/features/auth/components/ForgotPasswordForm.tsx` | 21 | no-explicit-any | `catch (err: any)` (see C3) |
| `src/features/auth/components/LoginForm.tsx` | 26 | no-explicit-any | `catch (err: any)` |
| `src/features/auth/components/RegisterForm.tsx` | 27 | no-explicit-any | `catch (err: any)` |
| `src/features/order/components/OrderDetails.tsx` | 7 | no-unused-vars | `Button` imported but unused |
| `src/shared/components/layout/Header.tsx` | 6, 25 | no-unused-vars | `ShoppingBag` unused; `mounted` computed but never used |
| `src/shared/contexts/FeatureContext.tsx` | 4 | no-unused-vars | `FEATURES` imported but unused |

Plus one pre-existing benign warning in `CheckoutForm.tsx` (`react-hooks/incompatible-library` on RHF `watch()`) — this one is expected and documented in `CLAUDE.md`; leave it.

**Fix:** remove the unused imports/vars, escape the apostrophe, and address `any`/`set-state` per C2/C3.

---

## C. Architecture-rule violations (from `CLAUDE.md`)

### C1. Duplicate, conflicting auth pages — **most important**
There are **two parallel auth UIs**:

- Real: `app/auth/login/page.tsx` and `app/auth/register/page.tsx` — render `<LoginForm>` / `<RegisterForm>` from `@/features/auth`, which use the auth store + service. Correct.
- Fake: `app/login/page.tsx` and `app/register/page.tsx` — self-contained pages with a `setTimeout` fake submit, **no auth store, no service**, that just `router.push('/account')`. They also use an undefined token `rounded-(--radius-xl)` (see D4).

Worse, the header links the user icon to **`/login`** (the fake one), so the real `/auth/login` is effectively unreachable from the UI, and "logging in" via `/login` pushes to `/account` **without ever setting `isAuthenticated`** — so `AuthGuard` immediately bounces the user back to `/auth/login`. Broken loop.

**Fix:** delete `app/login/` and `app/register/`. Point the header account link to `/account` (let `AuthGuard` redirect to `/auth/login` when logged out), or directly to `/auth/login`. Keep a single source of truth in `features/auth`.

### C2. `AuthGuard` uses the forbidden hydration pattern (rule #7)
`CLAUDE.md` rule #7: *"any component reading persisted Zustand stores must gate on `useHydrated()` — NOT `useEffect(() => setMounted(true))` (lint error)."* `AuthGuard` does exactly the forbidden thing:
```tsx
const [hydrated, setHydrated] = useState(false);
useEffect(() => { setHydrated(true); }, []);
```
**Fix:** delete the state + effect and use the shared hook:
```tsx
import { useHydrated } from '@/shared/hooks/useHydrated';
const hydrated = useHydrated();
```
This also clears lint error B/AuthGuard:16.

### C3. `any` used in auth forms (rule: "No `any`, ever")
`LoginForm`, `RegisterForm`, `ForgotPasswordForm` all use `catch (err: any)`.
**Fix:**
```tsx
catch (err) {
  setError(err instanceof Error ? err.message : 'Login failed');
}
```

### C4. Auth forms don't use react-hook-form + Zod (forms rule)
`CLAUDE.md` stack rule: *"react-hook-form + Zod on every form."* All three auth forms use raw `useState` with no schema/validation (no email format check, no password rules). This is the same pattern the rest of the app avoids (checkout uses RHF + Zod).
**Fix:** add a `features/auth/schema/auth.schema.ts` (Zod) and convert the forms to `useForm` + `zodResolver`, matching `features/checkout`.

### C5. Feature toggle is not enforced in the UI (enforcement points #1 & #3)
`CLAUDE.md` describes three enforcement points. Only the middleware (point #2) is wired up. Points #1 (nav filters by `isEnabled`) and #3 (feature root returns `null` when disabled) are missing:

- **Header nav** (`Header.tsx`) uses a hardcoded `NAV_LINKS` array and never calls `useFeature`. Nothing is filtered.
- **AccountNav** shows a **My Wallet** link unconditionally, even though `wallet` is `enabled: false` in `features.config.ts`. Clicking it hits `/account/wallet`, which the middleware rewrites to 404 → a dead link in the menu (see D1).
- No feature root component returns `null` when its key is disabled (e.g. `product-search`'s `SearchButton` always renders).

**Fix:** filter nav items with `useFeature(...)`; in `AccountNav`, wrap the wallet link in `useFeature('wallet') && (...)`; and have each toggleable feature's root early-return `null` when `!useFeature(key)`.

### C6. Feature config shape diverges from the documented contract
`CLAUDE.md` (order-base contract) specifies a per-feature `feature.config.ts` exporting `routes[]`, `navItems[]`, `subFeatures[]`, with sub-feature parenting. The Zaya implementation uses one central `FEATURES` record with only `{ key, label, enabled, routes? }` — no `navItems`, no `subFeatures`, no parent linkage. That's a reasonable simplification, but because there's no `parent`/`subFeatures`, the rule *"a sub-feature cannot be ON if its parent is OFF"* (e.g. `promo_code`/`order_note` under `cart`, `wallet` under `account`) is **not enforceable**. Decide whether to (a) adopt parenting, or (b) document that Zaya intentionally uses a flat registry.

---

## D. Correctness / logic bugs

### D1. `wallet` disabled but still linked (and `vouchers` is undefined)
`AccountNav` lists `/account/wallet` (feature disabled → 404) and `/account/vouchers` (no `vouchers` key exists in `features.config.ts` at all, though the page file exists). Both are orphan links.
**Fix:** gate wallet behind `useFeature('wallet')`; either add a `vouchers` feature key or remove the vouchers link/page.

### D2. `middleware` rewrites to `/404`, which isn't an App-Router route
```ts
return NextResponse.rewrite(new URL('/404', request.url));
```
App Router has no `/404` page (that's a Pages-Router convention); it uses `not-found.tsx`. Rewriting to a non-existent `/404` renders Next's fallback but typically with a **200** status, not a real 404.
**Fix:** rewrite to a route that calls `notFound()`, or return a proper 404 — e.g. create `app/not-found.tsx` and `rewrite` to a dedicated blocked path, or `return new NextResponse(null, { status: 404 })`. Verify the status in the network tab.

### D3. `register()` writes to an in-memory array — new users vanish on reload
`authService.register` does `USERS_DB.push(newUser)`. `USERS_DB` is a module-level array that resets on every full page reload / server restart. Combined with the **persisted** `Zaya-auth` store, a user who registers stays "logged in" after reload, but the account no longer exists in `USERS_DB`, so logging in again fails. State divergence.
**Fix (static-era):** persist registered users too (e.g. a `Zaya-users` persisted store) so the mock is internally consistent, and note this is replaced by the backend later.

### D4. Undefined design token `--radius-xl`
`app/login/page.tsx:29` and `app/register/page.tsx:30` use `rounded-(--radius-xl)`, but `tokens.css` only defines `--radius` and `--radius-lg`. The corner radius silently resolves to nothing.
**Fix:** these files should be deleted per C1; otherwise use `rounded-lg` or add `--radius-xl` to `tokens.css`.

### D5. Password stored/compared in plaintext under a `passwordHash` name
`users.data.ts` stores `passwordHash: 'password123'` (plaintext) and `authService.login` compares the raw password to it. The field name implies hashing that never happens.
**Fix (acceptable for a static mock, but):** rename the field to `password` to avoid implying security that isn't there, and add a `// TODO: real hashing when backend exists` note. Do not ship this pattern to production.

---

## E. Design smells (non-blocking)

### E1. `FeatureContext` is redundant indirection
The provider's value is always the static `isFeatureEnabled`, and `useFeature` just calls it. The context adds nothing over importing `isFeatureEnabled` directly, and it imports `FEATURES` without using it (lint B). Either delete the context and call `isFeatureEnabled`/`isFeatureEnabled` directly, or make the provider actually hold overridable state (useful for previews/per-client config).

### E2. `auth.store.ts` missing `'use client'`
Every other persisted store in the repo (`cart.store`, `favorites.store`) starts with `'use client'`. `auth.store` doesn't. It works today but is inconsistent and risks SSR access to `localStorage`. Add the directive.

### E3. `Loader` is one-size-only
`Loader` hardcodes a `min-h-[60vh]` full-page treatment, which is why A1 happened (the guard wanted a small one). Consider `Loader({ className, size }: { className?: string; size?: 'sm'|'lg' })`.

---

## Suggested fix order

1. **C1** — delete `app/login` + `app/register`, repoint the header link. (Removes B/contact-adjacent confusion, D4, and the fake-login loop.)
2. **A1 + C2** — fix `AuthGuard` (`Loader` usage + `useHydrated`).
3. **B + C3** — clear all remaining lint (unused imports, `any`, unescaped `'`).
4. **C5 + D1** — enforce the toggle in nav (Header + AccountNav wallet/vouchers).
5. **D2** — make the middleware return a real 404.
6. **C4, D3, D5, E1–E3** — hardening/consistency once the build is green.

After each group run:
```bash
pnpm typecheck   # expect 0
pnpm lint        # expect 0 errors (1 known CheckoutForm warning is fine)
pnpm build       # expect success
```

## What already looks good
- `AuthGuard` correctly wraps `app/account/layout.tsx`, and the account layout is `robots: noindex`.
- `Button` now supports `isLoading` (the earlier type errors on the forms are resolved).
- Middleware matcher correctly excludes `api`, `_next/*`, and `favicon`.
- The shop/cart UI work (sorting, redesigned card, wishlist, cart recommendations) passes typecheck and lint cleanly.
