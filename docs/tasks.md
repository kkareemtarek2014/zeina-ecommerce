# CMS + Dynamic Content + WebP Pipeline — Implementation Tasks

> Actionable task breakdown derived from `docs/cms-content-and-image-plan.md`.
> Work top to bottom. Each phase is independently shippable. Run the verification
> block (bottom of each phase) before moving on.
>
> **Golden rules (locked for V1):** `images.unoptimized: true` always · WebP-only
> storage (drop originals) · no announcement scheduling (`startsAt`/`endsAt`) ·
> five marketing/legal pages stay static JSX · CMS *references* catalog data,
> never stores prices/stock.

---

## Phase 0 — Wire existing settings + announcement engine

**Est:** ~1–1.5 days · **Goal:** storefront reads branding/contact from admin
settings (they already exist in D1 but are ignored), plus a rotating clickable
announcement bar.

### 0.1 Server branding reader
- [x] Add `getSiteBranding(): Promise<SiteBrandingDTO>` to `settings.service.ts`.
  - Batch-read keys in **one** `WHERE key IN (...)` query (never one query per key):
    `site_name`, `site_tagline`, `logo_url`, `favicon_url`, `contact_email`,
    `contact_phone`, `whatsapp_number`, `social_instagram`, `social_facebook`,
    `social_tiktok`, `footer_text`, `seo_default_title`, `seo_default_description`,
    `site_url`, `announcement_items`.
  - Map values by key → DTO. Apply field-specific fallbacks only: `SITE` for site
    name/tagline/URL/default SEO; `null` for logo, favicon, contact, WhatsApp, and
    social values when the setting is empty. Never show fake placeholder contacts.
- [x] Create `src/shared/contracts/storefront-branding.contract.ts` for the storefront-safe
  `SiteBrandingDTO`, `AnnouncementItem`, and `AnnouncementItemsSchema`.
  - This contract contains public storefront data only; do not expose pricing or admin-only
    settings.
  - Import `AnnouncementItemsSchema` into `admin-config.contract.ts` for the admin settings
    read/write schemas. Do not place `SiteBrandingDTO` in the admin-only contract.

### 0.2 Announcement data model
- [x] New settings key `announcement_items` = `AnnouncementItem[]`:
  ```ts
  type AnnouncementItem = {
    id: string;
    text: string;       // max ~80 chars
    href?: string;      // internal path default; external requires validation
    active: boolean;
    sortOrder: number;
    // V1: NO startsAt / endsAt
  };
  ```
- [x] Add strict Zod validation: unique non-empty IDs; text trimmed and max 80 chars;
  integer `sortOrder`; max **5 active** items.
- [x] In `getSiteBranding()`, normalize `announcement_items` from the `unknown` value returned
  by Drizzle's JSON-mode settings column. Use `AnnouncementItemsSchema.safeParse(value)`:
  a valid array is sorted and returned; `null`, a non-array, or an invalid shape becomes `[]`.
  Do not manually `JSON.parse` normal settings values—the column already uses Drizzle JSON mode.
  The Header must render no announcement strip when the normalized list is empty.
- [x] Accept internal links beginning with `/`. Permit an external link only when it is
  an `https:` URL; reject protocol-relative, `javascript:`, `data:`, and malformed URLs.
- [x] Add `announcementItems` to `adminSettingsDtoSchema`, `adminSettingsWriteSchema`,
  `WRITE_KEYS`, and the `getAdminSettings()`/`updateAdminSettings()` mapping. The current
  admin settings write API is allow-listed and will otherwise ignore this new setting.

### 0.3 Server-to-client storefront data flow
- [x] Make `RootLayout` async and call `getSiteBranding()` there. Do **not** import the
  server-only settings service into `Header`, `Footer`, or `StorefrontChrome`.
- [x] Keep V1 free of persistent caching, but avoid duplicate D1 reads from `RootLayout` and
  `generateMetadata()` in the same request. Use request-level memoization for the branding
  reader, or measure and explicitly accept the two batch reads in `pnpm preview`.
- [x] Pass a serializable, safe `branding` prop from `RootLayout` → `StorefrontChrome`
  → `Header`, `Footer`, and `WhatsAppButton`.
- [x] Replace static `export const metadata` with `generateMetadata()` so title,
  description, favicon, `metadataBase`, canonical, and OpenGraph defaults use branding.
  Validate `siteUrl` and fall back to `SITE.url` before constructing URLs.
- [x] `Header.tsx` — logo from `logoUrl` when present; otherwise render the site name;
  replace hardcoded bar with **rotating**
  `announcement_items`.
- [x] `Footer.tsx` — site name/description from settings; **add social icons section**
  (Instagram / Facebook / TikTok) only for valid configured URLs.
- [x] `StorefrontChrome.tsx` — pass `whatsappNumber` to `WhatsAppButton`; hide the FAB
  when absent rather than using its current hardcoded default.
- [x] `contact/page.tsx` — make the page async and read `getSiteBranding()` server-side.
  Render a card only for configured methods: email uses `mailto:`, phone uses `tel:`, and
  WhatsApp uses normalized digits in `https://wa.me/<digits>`. Do not label a `tel:` link
  as WhatsApp.

### 0.4 Announcement bar behavior (client)
- [x] Create `src/shared/components/layout/AnnouncementBar.tsx` and render it from `Header.tsx`.
  Keep rotation, link behavior, and accessibility state inside this component; do not add a
  separate feature folder or animation dependency.
- [x] Rotate every ~4–5s; pause on hover/focus.
- [x] `prefers-reduced-motion` → show first active item only.
- [x] Entire strip is a link when `href` set.
- [x] Keep the rotation timer inside the announcement component; clear it on unmount and reset
  it after an item receives focus/hover so it cannot change while someone is reading or clicking.
- [x] Implement pause/focus/reduced-motion behavior in this phase; there is no separate a11y
  phase before this can ship.

### 0.5 Admin, seed, and cache decision
- [x] Admin settings UI: simple announcement rows with Add, Remove, Active, and ↑/↓ sort
  controls. Do not introduce a drag-and-drop dependency for V1.
- [x] Show field-level validation errors returned by the settings endpoint; do not save
  malformed JSON/URLs optimistically.
- [x] Seed `announcement_items` from current Header copy + free-shipping + COD lines.
  Add the row to the existing `settingsRows` array in `src/server/db/seed.ts`; retain its
  `onConflictDoNothing()` behavior so re-seeding never overwrites an admin-configured list.
- [x] Use the live `{freeShippingThreshold}` value when seeding the shipping announcement;
  do not leave a message that can contradict checkout configuration.
- [x] Decide and document one cache model before coding:
  - **V1 recommended:** no server cache for `getSiteBranding()`; D1 is read per request and
    settings updates are visible immediately.
  - If caching is introduced later, define the cache tag/key and call `revalidateTag` after
    settings writes. Do not add generic cache invalidation without a matching cache.

### 0.6 CMS watermark / indicator in admin dashboard
- [x] Add a persistent **"CMS Mode"** watermark or badge visible across admin CMS pages
  (e.g. homepage builder, settings, media library) so the admin user always knows they
  are editing content that will appear on the storefront.
  - Use a subtle fixed-position badge (e.g. bottom-right or top-bar tag) with a label
    like "CMS" or "Content Editor" — visible but non-intrusive.
  - Style it distinctly from the storefront theme (e.g. accent outline, muted background)
    so it cannot be confused with live customer-facing UI.
  - Ensure it does **not** render on non-CMS admin pages (orders, users, activity log)
    to avoid noise — show it only on pages where the admin is editing storefront-visible
    content (settings/branding, announcements, homepage blocks, media).

**Verify:**
```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```
- [x] Logo / footer / WhatsApp / social links all come from admin settings.
- [x] Announcement bar rotates ≥2 items; click opens `href`; reduced-motion shows first only.
- [x] Contact page shows only configured email/phone/WhatsApp methods with the correct URL scheme.
- [x] Page source/metadata reflects configured site name, SEO defaults, favicon, and canonical base URL;
  empty optional settings do not render broken images or placeholder contact details.
- [x] On a storefront route, Chrome receives branding props; on `/admin/*`, it remains hidden
  and the WhatsApp FAB does not render.
- [ ] In `pnpm preview`, confirm branding reads have acceptable server response timing and that
  `RootLayout` plus `generateMetadata()` do not cause an accidental persistent cache.

---

## Phase 1 — WebP stills pipeline

**Est:** ~1–2 days for 1a, then ~1 day for 1b · **Goal:** first make `/admin/media`
store new still images as optimized WebP with real dimensions. Then reuse that proven processor
for manual product/category uploads. Do not touch Temu imports or bridal attachments in V1.

### 1.1 Spike (do first — de-risks the whole phase)
- [x] Choose WASM lib: `@jsquash/webp` (or `photon-wasm`).
  - Spike result: jSquash WASM imports fail under Next Turbopack/OpenNext; V1 ships via
    Cloudflare Images binding (`env.IMAGES`) — see `docs/image-pipeline-spike.md`.
- [x] In a Worker, measure JPEG/PNG/WebP decoder support, 5 MB JPEG conversion time +
  memory, and decoded-pixel limits.
- [x] Verify the selected package's `.wasm` asset is bundled and loaded by the production
  OpenNext/Cloudflare build—not only `next dev`. Run `pnpm build`, inspect the generated
  Worker output for the WASM asset/import, then run `pnpm preview` and convert a real fixture.
  Record the resulting Worker bundle size and confirm it remains within Cloudflare's deployment
  limits before committing to the package. Add no Wrangler configuration unless the verified
  production build requires it.
- [x] V1 accepts only JPEG, PNG, and WebP after byte/decode validation. SVG follows its
  existing passthrough path. Reject HEIC and GIF with a clear admin error unless the spike
  explicitly proves support and tests are added; do not add GIF-first-frame conversion in V1.
- [x] V1 is synchronous only. If the production spike exceeds practical Worker limits, stop this
  phase with a clear upload error; consider a Queue/Consumer design later rather than designing
  Queue infrastructure now.
- [x] **Go/no-go checkpoint:** record the production-build spike result before creating
  `image-processor.service.ts`. If WASM bundling, conversion, or limits fail, mark Phase 1
  deferred and ship Phase 0 independently. Phase 2 can still use the existing URL-based
  homepage blocks; do not block it on WebP processing.

### 1.2 Processor service (NEW)
- [x] Create `image-processor.service.ts`:
  - `processUpload(file, profile: 'product'|'hero'|'library'): Promise<ProcessedImage>`
  - Pipeline: decode → auto-orient (EXIF) → resize if > maxEdge → strip EXIF → encode WebP.
  - Reject: bad magic bytes, unsupported decoder input, excessive decoded pixels, oversized input.
  - SVG passes through unchanged; the raster processor accepts only the V1 formats above.
  - Return `{ bytes, width, height, mime: 'image/webp', extension: 'webp' }`.
- [x] Profiles:

  | Profile | Max edge | Quality | Use |
  | --- | --- | --- | --- |
  | `product` | 2048px | 82 | product + category images |
  | `hero` | 2560px | 85 | homepage hero / banners |
  | `library` | 2048px | 82 | general media library |

- [x] Unit tests with fixture buffers.

### 1.3a Ship `/admin/media` first
- [x] Add `putProcessedImage()` to `upload.service.ts`. It writes only successfully
  processed bytes to R2 with `contentType: image/webp` and returns key, URL, byte size,
  width, height, and MIME.
- [x] `admin-media.service.ts` `uploadAdminMedia` — replace `putCatalogImage` with
  `processUpload` + `putProcessedImage`; create a `media_assets` row with real dimensions.

### 1.3b Reuse it for manual catalog uploads
- [x] Product/category image routes — use the same processed upload helper and preserve their
  current URL-based DTO/storage model. Do not add a `media_assets` row, `mediaAssetId`, or a
  schema migration solely for these uploads in V1.
- [x] Confirm a replaced product/category image retains the current safe order: upload the new
  WebP → update the database URL → attempt to delete the old R2 object.

### 1.4 Delivery config
- [x] Lock `images.unoptimized: true` in `next.config.ts` (no custom loader in V1).
- [x] For newly processed media with known dimensions, pass `width`, `height`, and accurate
  `sizes` to `next/image` for CLS.
- [x] Preserve legacy PNG/JPG rendering without migration: when `width` or `height` is `null`,
  render the image in its existing fixed-aspect-ratio, `position: relative` container with
  `fill` and an explicit `sizes` value. Do not pass `undefined` dimensions to `next/image` or
  let a legacy asset collapse its card/gallery layout.
- [x] Apply that fallback only where legacy media metadata is actually available; catalog URL
  arrays without media records keep their current layout until they are replaced by a new upload.
- [x] Admin media UI: dimensions badge, mime type, alt-text edit.
- [x] Add `updateMediaAlt()` in repository/service, `adminMediaAltUpdateSchema`, and
  `PUT /api/admin/media/[id]/route.ts`. Require `media:write` (or the existing appropriate
  admin permission), validate trimmed alt text with a bounded length, and write an audit log.
- [x] **Do NOT migrate legacy images.** Old PNG/JPG URLs keep working; new uploads are WebP.

**Verify:**
```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```
- [x] `/admin/media` JPEG/PNG/WebP upload → stored as WebP; dimensions are populated in its
  media asset.
- [x] Manual product/category JPEG/PNG/WebP upload → stored as WebP and renders correctly
  through the existing URL-based catalog flow.
- [x] SVG is stored unchanged; HEIC/GIF are rejected with a clear message.
- [x] A legacy image with `width`/`height: null` still renders in a stable card/gallery box
  without an invalid `next/image` configuration or visible layout shift.

---

## Phase 2 — Lightweight conversion wiring ⭐ sales engine

**Est:** ~0.5–1 day · Maps to `BUSINESS-PLAN.md` §4–§5. Goal: marketing refreshes
the storefront weekly and pushes purchase intent **without a deploy**.
**Reuse** existing systems (homepage blocks, social-proof, bundles, preorders) —
do not rebuild commerce logic in CMS.

### 2a — Shop-the-vibe + hero ops
- [x] Where the existing hero/collection/promo editors support image selection, wire the
  existing MediaPicker to return and save the current **URL**. Keep block schemas URL-based;
  do not add `mediaAssetId`, new block types, or a migration.
- [x] Keep two hero CTAs (`Shop New In` / `Best Sellers`) editable in block config.
- [x] Admin checklist doc: "Monday drop ritual" — swap hero + vibe tiles in <10 min.

### 2b — Existing social proof only
- [x] Confirm the existing social-proof component can render the configured Instagram handle
  and simple outbound post links without a new cover-image or grid data model.
- [x] If it can, gate that existing output with `social_proof` on the homepage. If it cannot,
  defer Instagram proof rather than building a new UGC block, cover field, or PDP strip.

### 2c — Verify existing bundles and pre-orders
- [x] Use an existing promo block to link to the bundles surface when `bundles` is ON.
- [x] Turn on `bundles`/`preorders` only in a safe environment and confirm existing product
  card/PDP badges, stock rules, and ETA data are correct. Fix a proven defect only; do not
  rebuild badges or put sell prices/stock rules into CMS configuration.

**Use manually configured UTMs in announcement links if desired. Do not add event tracking or
new analytics instrumentation in this task.**

**Verify:**
- [x] Marketing swaps an existing hero/collection image via MediaPicker without deploy.
- [x] Existing social proof is either correctly gated or explicitly deferred.
- [x] Bundle link is shown only when `bundles` is ON.
- [x] Existing sold-out/pre-order UI matches real product state after flags are enabled.

---

## Deferred (build only when triggered)

| Item | Trigger |
| --- | --- |
| Responsive variants + `srcset` | Real-device LCP data shows single WebP insufficient |
| Blur/LQIP placeholder | Store 20×20 base64 in `media_assets` |
| AVIF + WebP fallback | Want ~20% smaller than WebP |
| WebP migration job for legacy images | Legacy images materially hurt performance |
| Queue/Consumer image processing | Production Worker spike cannot process supported V1 uploads within practical limits |
| Temu image conversion + remote-fetch hardening | Media library and manual catalog uploads are proven; ship conversion together with HTTPS supplier allowlist, redirect revalidation, streamed byte cap, and decode validation |
| Bridal image WebP conversion | Public catalog/media pipeline is stable and staff-preview value justifies touching private request files |
| Media IDs or homepage media-reference deletion checks | URL-based homepage blocks create a proven media-management/deletion problem |
| Announcement scheduling | Promos need auto start/stop without a human |
| `pages` + `page_blocks` tables | >10 editable pages, reusable cross-page blocks, blog, or paid landing pages |
| Editable About / legal pages | Content changes often enough to justify sanitize + publish + revision workflow |
| On-site product video | After real photos, core CRO, and review-submit flow are live |
| Review-photo UGC grid | After storefront review-submit UI lands |
| CMS analytics/CTR instrumentation | Analytics plan and ownership are defined outside this CMS work |

---

## File map (planned changes)

| Area | Files |
| --- | --- |
| Services | `settings.service.ts` (`getSiteBranding`, `announcement_items`) |
| Services | `image-processor.service.ts` **(NEW)** |
| Services | `admin-media.service.ts`, `upload.service.ts` (`putProcessedImage`) |
| Repository | `media.repo.ts` (alt update) |
| Contracts | `storefront-branding.contract.ts` **(NEW)** (`SiteBrandingDTO`, `AnnouncementItem`, `AnnouncementItemsSchema`) |
| Contracts | `admin-config.contract.ts` (imports announcement schema for settings DTO/write validation) |
| Contracts | Media-alt write schema / admin media DTO dimensions |
| API | `src/app/api/admin/media/[id]/route.ts` (add `PUT` alongside existing delete behavior) |
| Layout / chrome | `layout.tsx`, `Header.tsx`, `AnnouncementBar.tsx` **(NEW)**, `Footer.tsx`, `StorefrontChrome.tsx` |
| Pages | `contact/page.tsx` |
| Admin UI | `src/features/admin/components/SettingsForm.tsx` (simple announcement rows) |
| Seed | `src/server/db/seed.ts` (`settingsRows` adds `announcement_items`) |
| Config | `next.config.ts` (`images.unoptimized: true`); test flags in a safe environment before enabling production `social_proof`/`bundles`/`preorders` |

---

## Risks to watch

- Worker CPU timeout / decompression bomb → magic-byte + decoded-pixel checks; reject safely.
- WASM bundle size → dynamic-import processor only in upload routes.
- Dynamic branding causes stale storefront → V1 has no server cache; if caching is introduced,
  document its tag and invalidate it after settings writes.
- Double-optimize on Workers → locked `images.unoptimized: true`.
- CMS reinventing bundles/stock → blocks only link to existing catalog/bundle surfaces;
  pricing, stock, eligibility, and ETA logic stay in services.
- Announcement spam → cap 5 active; links required for promo claims where possible.
- Fragile Instagram embeds → V1 uses outbound links only; no embed or cover-image system.
